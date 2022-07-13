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
    console.log('test inputName(): ', inputName());
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