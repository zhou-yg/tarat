import {
  compose,
  state,
} from 'tarat-core'
import login from 'user-login-system/dist/hooks/login'
console.log('login: ', login);

export default function main () {

  const loginHook = compose(login.default || login)

  const s = state(0)

  return {
    s,
    alreadyLogin: loginHook.alreadyLogin
  }
}