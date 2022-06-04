import {
  inputCompute,
  state,
  model,
  inputComputeClient
} from '@tarot-run/core'

function newTodoItem(description) {
  return {
    status: 'undone',
    description,
  }
}

export default function todo () {
  const s1 = state({ num: 0 })
  const s2 = state(2)

  const items = model(() => ({
    entity: 'todoItem',
    where: {
      status: 'undone'
    }
  }), { immediate: true })
  

  const createTodoItem = inputComputeClient(async description => {
    items(d => {
      d.push(newTodoItem(description))
    })
  })

  return {
    items,
    createTodoItem,
    s1,
    s2,
  }
}