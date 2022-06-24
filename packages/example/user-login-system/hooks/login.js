import {
  state,
  cache,
  model,
  computed,
  combineLatest,
  inputCompute,
  inputComputeInServer,
} from 'tarat-core'
import {nanoid} from 'nanoid'

export default function login () {
  const name = state()
  name._hook.name = 'name'
  const password = state()
  password._hook.name = 'password'

  const inputName = state()
  inputName._hook.name = 'inputName'
  const inputPassword = state()
  inputPassword._hook.name = 'inputPassword'
  const repeatPassword = state()
  repeatPassword._hook.name = 'repeatPassword'
  
  const signAndAutoLogin = state(false)
  signAndAutoLogin._hook.name = 'signAndAutoLogin'
  

  /* 6 */

  const cookieId = cache('userDataKey', { from: 'cookie' }) // just run in server because by it depends 'cookie'
  cookieId._hook.name = 'cookieId'
  const userDataByInput = model(() => ({
    entity: 'user',
    query: {
      where: {
        name: name(), // maybe be unique?
        password: password(),
      }
    }
  }))
  userDataByInput._hook.name = 'userDataByInput'

  const sessionStore = model(() => {
    return ({
      entity: 'sessionStore',
      query: {
        where: {
          fromIndex: cookieId()
        }
      }
    })
  }, { ignoreEnable: true })
  sessionStore._hook.name = 'sessionStore'

  /* 9 */

  const userIdInSession = computed(() => {
    console.log('ss 1');
    const ss = sessionStore()
    console.log('ss 2', ss);
    if (ss && ss.length > 0) {
      return {
        name: ss[0].name,
        password: ss[0].password
      }
    }
  })
  userIdInSession._hook.name = 'userIdInSession'

  console.log('userIdInSession: ', userIdInSession._hook);
  const userDataByCookie = model(() => ({
    entity: 'user',
    query: {
      where: {
        name: (userIdInSession())?.name,
        password: (userIdInSession())?.password,
      }
    }
  }))
  userDataByCookie._hook.name = 'userDataByCookie'

  const userData = computed(async () => {
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
  userData._hook.name = 'userData'

  const alreadyLogin = computed(() => {
    const ud = userData()
    console.log('userData: ', ud);
    return !!ud
  })
  alreadyLogin._hook.name = 'alreadyLogin'

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
    if (name() && password() && await userData() === null) {
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
  errorTip1._hook.name = 'errorTip1'

  const errorTip2 = state('')
  errorTip2._hook.name = 'errorTip2'

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
  sign._hook.name = 'sign'

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
  login._hook.name = 'login'

  const logout = inputComputeInServer(() => {
    name(() => undefined)
    password(() => undefined)
    const cid = cookieId()
    console.log('logout cid: ', cid);
    cookieId(() => '')
    sessionStore(arr => {
      console.log('[userIdInSession] arr: ', arr);
      const i = arr.findIndex(o => o.fromIndex === cid)
      console.log('[userIdInSession] logout i: ', i);
      arr.splice(i, 1)
    })
  })
  logout._hook.name = 'logout'

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