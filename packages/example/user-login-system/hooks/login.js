import {
  state,
  cache,
  model,
  computed,
  combineLatest,
  inputCompute,
  inputComputeInServer,
} from 'tarat-core'
import loginDeps from './login.deps.js'
import nanoid from 'nanoid'

Object.assign(login, {
  __deps__: loginDeps.login
})

export default function login () {
  const name = state()
  name._hook && (name._hook.name = 'name')

  const password = state()
  password._hook && (password._hook.name = 'password')

  const inputName = state()
  inputName._hook && (inputName._hook.name = 'inputName')
  const inputPassword = state()
  inputPassword._hook && (inputPassword._hook.name = 'inputPassword')
  const repeatPassword = state()
  repeatPassword._hook && (repeatPassword._hook.name = 'repeatPassword')
  
  const signAndAutoLogin = state(false)
  signAndAutoLogin._hook && (signAndAutoLogin._hook.name = 'signAndAutoLogin')
  

  /* 6 */
  const cookieId = cache('userDataKey', { from: 'cookie' }) // just run in server because by it depends 'cookie'
  cookieId._hook && (cookieId._hook.name = 'cookieId')
  /* 7 */
  const userDataByInput = model('user', (prev) => {
    if (name() && password()) {
      return {
        where: {
          name: name(), // maybe be unique?
          password: password(),
        }
      }
    }
  })
  userDataByInput._hook && (userDataByInput._hook.name = 'userDataByInput')

  const sessionStore = model('sessionStore', (prev) => {
    const cid = cookieId()
    // client: ps, server: no?
    if (cid) {
      return ({
        where: {
          fromIndex: cid
        }
      })
    }
  }, { ignoreClientEnable: true })
  sessionStore._hook && (sessionStore._hook.name = 'sessionStore')

  /* 9 */
  const userIdInSession = computed(() => {
    const ss = sessionStore()
    console.log('ss: ', ss);
    if (ss && ss.length > 0) {
      return {
        name: ss[0].name,
        password: ss[0].password
      }
    }
  })
  userIdInSession._hook && (userIdInSession._hook.name = 'userIdInSession')

  const userDataByCookie = model('user', (prev) => {
    const u = userIdInSession()
    if (u) {
      return {
        where: {
          name: u.name,
          password: u.password,
        }
      }
    }
  })
  userDataByCookie._hook && (userDataByCookie._hook.name = 'userDataByCookie')

  /* 11 */
  const userData = computed(() => {
    const u1 = userDataByCookie()
    console.log('u1: ', u1);
    if (u1?.length > 0) {
      return u1[0]
    }
    const u2 = userDataByInput()
    console.log('u2: ', u2);
    if (u2?.length > 0) {
      return u2[0]
    }
  })
  userData._hook && (userData._hook.name = 'userData')

  /* 12 */
  const alreadyLogin = computed(() => {
    const ud = userData()
    console.log('userData: ', ud);
    return !!ud
  })
  alreadyLogin._hook && (alreadyLogin._hook.name = 'alreadyLogin')

  /**
   * login:
   * 1.invalid password
   * 2.check repeat password (should handled by UI)
   * 3.user not exist
   * 
   * sign:
   * 1.user already exist
   * 
   * common:
   * 1.http error
   */
  const errorTip1 = computed(async () => {
    if (name() && password() && !userData()) {
      return 'invalid password'
    }
    if (repeatPassword() && repeatPassword() !== password()) {
      return 'input same password twice'
    }
    if (name() === '') {
      return 'must input name'
    }
    if (password() === '') {
      return 'must input password'
    }
    return ''
  })
  errorTip1._hook && (errorTip1._hook.name = 'errorTip1')

  const errorTip2 = state('')
  errorTip2._hook && (errorTip2._hook.name = 'errorTip2')

  const errorTip = combineLatest([errorTip1, errorTip2])

  const sign = inputComputeInServer(async () => {
    const inputNameVal = inputName()
    const inputPasswordVal = inputPassword()
    const r = await userDataByInput.exist({ name: inputNameVal, password: inputPasswordVal })
    if (!r) {
      userDataByInput((draft) => {
        draft.push({
          name: inputNameVal, 
          password: inputPasswordVal
        })
      })
      if (signAndAutoLogin()) {
        login(inputNameVal, inputPasswordVal)
      }  
    } else {
      errorTip2(() => 'user already exist')
    }
  })
  sign._hook && (sign._hook.name = 'sign')

  /* 16 */
  const login = inputComputeInServer(async () => {
    const inputNameVal = inputName()
    const inputPasswordVal = inputPassword()
    const valid = await userDataByInput.exist({ name: inputNameVal, password: inputPasswordVal }) // query DB
    if (valid) {
      name(() => inputNameVal)
      password(() => inputPasswordVal)

      const nid = nanoid()

      sessionStore((draft) => {
        draft.push({
          name: inputNameVal, 
          password: inputPasswordVal,
          fromIndex: nid,
        })
      })

      cookieId(() => nid)
    } else {
      errorTip2(() => `invalid password with "${inputNameVal}"`)
    }
  })
  login._hook && (login._hook.name = 'login')

  const logout = inputComputeInServer(() => {
    name(() => null)
    password(() => null)
    const cid = cookieId()
    console.log('logout cid: ', cid);
    cookieId(() => '')
    sessionStore(arr => {
      console.log('[userIdInSession] arr: ', arr);
      const i = arr.findIndex(o => o.fromIndex === cid)
      console.log('[userIdInSession] logout i: ', i);
      if (i >= 0) {
        arr.splice(i, 1)
      }
    })
  })
  logout._hook && (logout._hook.name = 'logout')

  return {
    alreadyLogin,
    name,
    password,
    inputName,
    inputPassword,
    repeatPassword,
    signAndAutoLogin,
    userData,
    errorTip,
    sign,
    login,
    logout
  }
}
