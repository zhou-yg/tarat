# beta version

target: implement the user login system description below

tranditional login system:

- client: fetch user data
  - server: check the cookieId
    - exist: fetch user data in redis by cookieId
      - success: response user data
      - fail: response nothing or "not login" message
    - not exist: same fail above
- client: sign with name and password
- client: login with name and password
  - server(additional if sign): check repeat and create new UserModel
  - server: query user in UserModel by name and password
    - success: 
      - generate a nanoid
        - cocurrency: sync to cache, set a nanoid to redis with user data
        - response: 
          - set nanoid to cookie with key
          - user data
    - fail: 
      - response: http code 400 or "login fail" message
- client: logout
  - server: check the cookieId
    - exist: delete the value in redis by cookieId
      - set blank to the key in cookie
      - response success
    - no: response success

```javascript 
// ignore some import and config 
function userData () {
  const name = state()
  const password = state()

  const signAndAutoLogin = state(false)

  const cookieId = cache('userDataKey', { from: 'cookie' }) // just run in server because by it depends 'cookie'
  const userData = model(() => {
    entity: 'User',
    query: {
      where: {
        name: name(), // maybe be unique?
        password: password()
      }
    }
  })
  const userDataCache = cache(cookieId, { source: userData from: 'redis' }) // same above

  const errorTip = computed(() => {
    if (name() && password() && userData() === null) {
      return 'invalid password'
    }
  })

  const sign = inputCompute((inputName, inputPassword) => {
    if (signAndAutoLogin()) {
      login(inputName, inputPassword)
    }
    // await checkUserRepeat(inputName, inputPassword) or the name is unque
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

```
# features

sort by priority

- 1.new feature
  - core part
    - "cache" hook
      - cookie
      - redis
    - "mode"
      - "model" directive
        - exist
      - "model" lazy query aysnc
      - computed with state
    - "context" synchronism with 0 compute
      -  migrate query if immediate or not in two side
  - connect part
    - access hook in "views" component
      - react
  - server part
    - static compose dependent hook into current project
      - extra relation description
    - view mount container config entry
- 2.upgrade performance
  - "model" global referrence
- 3.upgrade development experience
  - cleint data mode
  - run production
  - page router / view router
  - runner with typescript types snippets √
  - server part
    - support hook writen by ts, need a compiler to migrate client/server
