import {
  computed,
  inputComputeInServer,
  model,
  state
} from 'tarat-core'

export interface ITopic {
  id?: number
  title: string
}

export interface ITopicProps {
  id?: number
}

export default function topic () {

  const topics = model<ITopic[]>('topic', () => ({
    orderBy: {
      createdAt: 'desc'
    }
  }))

  const inputName = state('')
  
  const add = inputComputeInServer(() => {
    if (inputName()) {
      topics(arr => {
        arr.push({
          title: inputName()
        })
      })
      inputName(() => '')
    }
  })

  return {
    topics,
    add,
    inputName
  }
}
/*--tarat deps start--*/
const deps = {'topic':[['h',2,[1],[0,1]]]}
Object.assign(topic, { __deps__: deps.topic, __name__: 'topic' })
/*--tarat deps end--*/
