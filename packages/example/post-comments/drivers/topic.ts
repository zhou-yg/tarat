import {
  computed,
  connectCreate,
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

  connectCreate(topics, () => ({
    title: inputName()
  }))
  
  const add = inputComputeInServer(function * () {
    if (inputName()) {
      yield topics.create()
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
const deps = {'topic':[['h',2,[1,0],[1]]]}
Object.assign(topic, { __deps__: deps.topic, __name__: 'topic' })
/*--tarat deps end--*/
