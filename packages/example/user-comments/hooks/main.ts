import {
  compose,
  state,
} from 'tarat-core'
import login from 'user-login-system/dist/hooks/esm/login'

export default function main () {

  const loginHook = compose(login)

  const s = state(0)

  return {
    s,
    alreadyLogin: loginHook.alreadyLogin,
    add: login.add,
  }
}
