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
  const userData = model(() => ({
    entity: 'user',
    query: {
      where: {
        name: name(), // maybe be unique?
        password: password()
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

  const errorTip = computed(() => {
    if (name() && password() && userData() === null) {
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
    userData: userDataCache(),
    errorTip,
    sign,
    login,
    logout
  }
}