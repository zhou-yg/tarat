import {
  state,
  model,
  inputCompute,
  after,
  before,
  freeze,
  inputComputeInServer,
  computed,
  clientModel,
  cache
} from '../src/core'
import { loadPlugin } from '../src/plugin'

initModelConfig()

export function initModelConfig(obj: any = {}) {
  loadPlugin('Model', {
    async find(e, w) {
      return []
    },
    async update(e, w) {
      return []
    },
    async remove(e, d) {
      return []
    },
    async create(e, d) {
      return {}
    },
    async executeDiff(d) {},
    ...obj
  })
  loadPlugin('Context', {
    async postDiffToServer(d) {},
    async postComputeToServer(c) {
      return []
    },
    async postQueryToServer(c) {
      return []
    },
    ...obj
  })
  const cacheMap = new Map<string, any>()
  loadPlugin('Cache', {
    async getValue(key, from) {
      return cacheMap.get(key)
    },
    async setValue(k, v) {
      cacheMap.set(k, v)
    },
    clearValue(k, from) {
      cacheMap.delete(k)
    }
  })
}

export function wait(ms: number = 15) {
  return new Promise(r => setTimeout(r, ms))
}

export function blank() {}
export function returnArg(arg: any) {
  return arg
}
export function oneState(arg: { a: number }) {
  const s1 = state(arg.a)

  return {
    s1
  }
}
export function oneModel() {
  const m1 = model(() => ({
    entity: 'test-model',
    query: {}
  }))
  return {
    m1
  }
}
export function oneCompute(arg?: { a: number }) {
  const f1 = inputCompute((arg: any) => {})
  return {
    f1
  }
}
export function oneEffect(arg: { a: number; s1Changed: Function }) {
  const stateBM = oneState(arg)

  after(() => {
    arg.s1Changed()
  }, [stateBM.s1])

  return {
    s1: stateBM.s1
  }
}
export function beforeWithFreeze(v: number) {
  const num = state(v)

  const markBefore = { value: 0 }

  const addNum = inputCompute(v => {
    num(d => {
      return d + v
    })
  })

  before(() => {
    markBefore.value++
    let cur: any = num()
    if (cur > 0) {
      freeze(addNum)
    }
  }, [addNum])

  return {
    markBefore,
    num,
    addNum
  }
}
export function effectAfter(v: number) {
  const num = state(v)

  const markBefore = { value: 0 }

  const addNum = inputCompute(v => {
    num(d => {
      return d + v
    })
  })

  after(() => {
    markBefore.value++
  }, [addNum, num])

  return {
    markBefore,
    num,
    addNum
  }
}

export function plainObjectState(obj1: { [key: string]: any }, num2: number) {
  const s1 = state(obj1)
  const s2 = state(num2)

  return {
    s1,
    s2
  }
}

export function changeStateInputCompute(obj1: { num1: number }, num2: number) {
  const ps = plainObjectState(obj1, num2)

  const { s1, s2 } = ps

  const changeS1 = inputCompute((v: number, v2?: number) => {
    s1((draft: any) => {
      draft.num1 = Math.random()
    })
    s1((draft: any) => {
      draft.num1 = v
    })
    if (v2) {
      s2((d: any) => {
        return d + v2
      })
    }
  })

  return {
    ...ps,
    changeS1
  }
}
export function changeStateInputComputeServer(
  obj1: { num1: number },
  num2: number
) {
  const ps = plainObjectState(obj1, num2)

  const { s1, s2 } = ps

  const changeS1 = inputComputeInServer((v: number) => {
    s1((draft: any) => {
      draft.num1 = v
    })
  })

  return {
    ...ps,
    changeS1
  }
}

export function changeStateAsyncInputCompute(
  obj1: { num1: number },
  num2: number
) {
  const ps = plainObjectState(obj1, num2)

  const { s1, s2 } = ps

  const changeS1 = inputCompute(async (v: number, v2?: number) => {
    s1((draft: any) => {
      draft.num1 = Math.random()
    })
    await new Promise(resolve => setTimeout(resolve, 100))

    s1((draft: any) => {
      draft.num1 = v
    })
    if (v2) {
      s2((d: any) => {
        return d + v2
      })
    }
  })

  return {
    ...ps,
    changeS1
  }
}

export function userPessimisticModel() {
  const users = model(
    () => ({
      entity: 'item',
      query: {}
    }),
    { immediate: true, pessimisticUpdate: true }
  )

  return {
    users
  }
}

export function userModelInputeCompute() {
  const items = model<{ id: number; name?: string }[]>(
    () => ({
      entity: 'item',
      query: {}
    }),
    { immediate: true, pessimisticUpdate: true }
  )

  const fn = async (id: number, name: string) => {
    const exist = await items.exist({ name })
    if (!exist) {
      items(arr => {
        if (arr) {
          arr.push({ id, name })
        }
      })
    }
  }
  const createItem = inputCompute(fn)

  return {
    items,
    createItem
  }
}

export function userModelClient() {
  const num = state(0)
  const users = clientModel(
    () => ({
      entity: 'item',
      query: {
        where: {
          num: num()
        }
      }
    }),
    { immediate: true, pessimisticUpdate: true }
  )

  return {
    users
  }
}
export function userModelComputedQuery() {
  const targetName = state('')
  const users = model(
    () => ({
      entity: 'item',
      query: {
        where: {
          name: targetName()
        }
      }
    }),
    { immediate: true, pessimisticUpdate: true }
  )

  return {
    users,
    targetName
  }
}

export function blankComputed(v: number) {
  const c = computed(() => {
    return v
  })
  return { c }
}
export function onePrimitiveStateComputed(v1: number, v2: number) {
  const s = state(v1)
  const c = computed(() => {
    return s() + v2
  })
  return { s, c }
}
export function asyncComputed(v1: number, v2: number) {
  const s = state(v1)
  const c = computed(async () => {
    return s() + v2
  })
  return { s, c }
}

export function computedWithArray() {
  const arr = state(new Array(5).fill('_').map((_, i) => ({ num: i })))
  const guard = state(2)
  const arr2 = computed(() => {
    return arr().filter(v => v.num < guard())
  })

  return {
    arr2,
    arr,
    guard
  }
}

export function onlyCache() {
  const c = cache('num', {
    from: 'redis'
  })

  return {
    c
  }
}
export function cacheWithSource(v: { num: number }) {
  const s = state(v)
  const c = cache('num', {
    from: 'redis',
    source: s
  })

  return {
    s,
    c
  }
}
