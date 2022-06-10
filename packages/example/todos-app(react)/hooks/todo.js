import {
  inputCompute,
  state,
  model,
  inputComputeInServer,
  computed
} from 'tarat-core'

function newTodoItem(description) {
  return {
    status: 'undone',
    description,
  }
}

export default function todo () {

  const items = model(() => ({
    entity: 'todoItem',
    where: {
      status: 'undone'
    }
  }), { immediate: true })

  const undoneItems = computed(() => {
    const arr = items()
    if (arr) {
      return arr.filter(item => item.status === 'undone')
    }
    return []
  })

  const createTodoItem = inputComputeInServer(async description => {
    items(d => {
      d.push(newTodoItem(description))
    })
  })

  return {
    items,
    createTodoItem,
    undoneItems,
  }
}