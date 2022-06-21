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
  const password = state()

  const inputName = state()
  const inputPassword = state()
  const repeatPassword = state()

  const signAndAutoLogin = state(false)

  /* 6 */

  const cookieId = cache('userDataKey', { from: 'cookie' }) // just run in server because by it depends 'cookie'
  const userDataByInput = model(() => ({
    entity: 'user',
    query: {
      where: {
        name: name(), // maybe be unique?
        password: password(),
      }
    }
  }))
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
  const userData = computed(async () => {
    const u1 = userDataByCookie()
    if (u1?.length > 0) {
      return u1[0]
    }
    const u2 = userDataByInput()
    if (u2?.length > 0) {
      return u2[0]
    }
  })

  const alreadyLogin = computed(() => {
    const ud = userData()
    return !!ud
  })

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
  const errorTip2 = state('')

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

  const logout = inputComputeInServer(() => {
    name(() => undefined)
    password(() => undefined)
    const cid = cookieId()
    cookieId(() => '')
    userIdInSession(arr => {
      const i = arr.findIndex(o => o.fromIndex === cid)
      arr.splice(i, 1)
    })
  })

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