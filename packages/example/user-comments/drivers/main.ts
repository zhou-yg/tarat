import {
  compose,
  state,
} from 'tarat-core'
import login from './login'

export default function main () {

  const loginHook = compose(login)

  const s = state(0)

  return {
    s,
    alreadyLogin: loginHook.alreadyLogin,
    add: login.add,
  }
}

/*--tarat deps start--*/
const deps = {'main':[]}
Object.assign(main, { __deps__: deps.main, __name__: 'main' })
/*--tarat deps end--*/
