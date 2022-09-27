import {
  inputCompute,
  state,
  model,
  inputComputeInServer,
  computed
} from 'tarat/core'
import indexes from '@/models/indexes.json'

function newTodoItem(description: string): { status: 'done' | 'undone', description: string } {
  return {
    status: 'undone',
    description,
  }
}

export default function todo () {

  const items = model<{ id?: number, status: 'done' | 'undone', description: string }[]>(indexes.TodoItem, () => ({
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

  const createTodoItem = inputComputeInServer(async (description: string) => {
    console.log('description: ', description);
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