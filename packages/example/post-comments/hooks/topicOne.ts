import {
  computed,
  inputComputeInServer,
  model,
  state
} from 'tarat-core'
import { ITopic } from './topic'

export interface ITopicProps {
  id?: number
}

function topicOne (props: ITopicProps) {

  const topicId = state(props.id)

  const topicsById = model<ITopic[]>('topic', () => {
    const tid = topicId()
    if (tid) {
      return {
        where: {
          id: tid
        }
      }
    }
  })

  const currentTopic = computed(() => {
    return topicsById()[0]
  })

  return {
    topicId,
    currentTopic,
  }
}

export default topicOne
/*--tarat deps start--*/
const deps = {'topicOne':[['h',1,[0]],['h',2,[1]]]}
Object.assign(topicOne, { __deps__: deps.topicOne, __name__: 'topicOne' })
/*--tarat deps end--*/
