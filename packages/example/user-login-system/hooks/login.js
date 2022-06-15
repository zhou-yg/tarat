import {
  state,
  cache,
  model,
  computed,
  combineLatest,
  inputCompute,
  inputComputeInServer,
} from 'tarat-core'

export default function login () {
  const name = state()
  const password = state()

  const inputName = state()
  const inputPassword = state()
  const repeatPassword = state()

  const signAndAutoLogin = state(false)

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
  const sessionStore = model(() => ({
    entity: 'sessionStore',
    query: {
      where: {
        fromIndex: cookieId()
      }
    }
  }))

  const userIdInSession = computed(async () => {
    const ss = await sessionStore()
    console.log('ss: ', ss);
    if (ss && ss.length > 0) {
      return ss[0].userId
    }
  })
  const userDataByCookie = model(() => ({
    entity: 'user',
    query: {
      where: {
        id: userIdInSession()
      }
    }
  }))
  const userData = computed(async () => {
    const u1 = await userDataByCookie()
    if (u1?.length > 0) {
      return u1[0]
    }
    const u2 = await userDataByInput()
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
    const inputName = name()
    const inputPassword = password()
    const r = await userData.exist({ name: inputName, password: inputPassword })
    if (!r) {
      userData((draft) => {
        draft.push({
          name: inputName, 
          password: inputPassword
        })
      })
      if (signAndAutoLogin()) {
        login(inputName, inputPassword)
      }  
    } else {
      errorTip2(() => 'user already exist')
    }
  })

  const login = inputComputeInServer(async () => {
    const inputName = name()
    const inputPassword = password()
    const valid = await userData.exist({ name: inputName, password: inputPassword }) // query DB
    if (valid) {
      name(() => inputName)
      password(() => inputPassword)
      cookieId(() => nanoid())
    } else {
      errorTip2(() => `invalid password with "${inputName}"`)
    }
  })

  const logout = inputComputeInServer(() => {
    name(() => undefined)
    password(() => undefined)
    cookieId(() => undefined)
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