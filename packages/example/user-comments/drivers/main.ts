import {
  compose,
  computed,
  progress,
  state,
} from 'tarat-core'
import login from './compose/login'

export default function main () {

  const loginHook = compose(login)

  const s = state(0)

  const userDataProgress = progress(loginHook.userData)
  console.log('userDataProgress: ', userDataProgress);

  const notLogin = computed(() => {
    return !loginHook.alreadyLogin() && userDataProgress().state === 'idle'
  })

  return {
    s,
    notLogin,
    add: login.add,
  }
}


/*--tarat deps start--*/
const deps = {'main':[['h',1,[['c',0,'alreadyLogin']]]]}
Object.assign(main, { __deps__: deps.main, __name__: 'main' })
/*--tarat deps end--*/
