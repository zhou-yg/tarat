import {
  compose,
  computed,
  connectCreate,
  inputComputeInServer,
  progress,
  state,
} from 'tarat-core'
import login from './compose/login'
import topic from './compose/topic'

export default function main () {
  const loginHook = compose(login)
  const s = state(0)
  const userDataProgress = progress(loginHook.userData)

  const notLogin = computed(() => {
    return !loginHook.alreadyLogin() && userDataProgress().state === 'idle'
  })

  const topicResult = compose(topic)
  connectCreate(topicResult.topics, () => {
    return {
      user: {
        connect: {
          id: loginHook.userData()?.id
        }
      }
    }
  })


  const removeTopic = inputComputeInServer(async function (id: number) {
    await topicResult.topics.remove([id])
  })

  return {
    s,
    notLogin,
    add: login.add,
    ...topicResult,
    removeTopic,
  }
}


/*--tarat deps start--*/
const deps = {'main':[['h',1,[['c',0,'alreadyLogin']]]]}
Object.assign(main, { __deps__: deps.main, __name__: 'main' })
/*--tarat deps end--*/
