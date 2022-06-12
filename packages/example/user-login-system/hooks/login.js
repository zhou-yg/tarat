import {
  state,
  cache,
  model,
} from 'tarat-core'

export default function login () {
  const name = state()
  const password = state()

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
    if (ss.length > 0) {
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

  /**
   * login:
   * 1.invalid password
   * 2.user not exist
   * 
   * sign:
   * 1.user already exist
   */
  const errorTip = computed(async () => {
    if (name() && password() && await userData() === null) {
      return 'invalid password'
    }
  })

  const sign = inputCompute(async (inputName, inputPassword) => {
    if (signAndAutoLogin()) {
      login(inputName, inputPassword)
    }
    await userData.exist({ name: inputName, password: inputPassword })
    userData((draft) => {
      draft.push({
        name: inputName, 
        password: inputPassword
      })
    })
  })

  const login = inputCompute(async (inputName, inputPassword) => {
    const valid = await userData.exist({ name: inputName, password: inputPassword }) // query DB
    if (valid) {
      name(() => inputName)
      password(() => inputPassword)
      cookieId(() => nanoid())
    } else {
      errorTip(() => 'invalid password')
    }
  })

  const logout = inputCompute(() => {
    name(() => undefined)
    password(() => undefined)
    cookieId(() => undefined)
  })

  return {
    signAndAutoLogin,
    userData,
    errorTip,
    sign,
    login,
    logout
  }
}