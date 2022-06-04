import {
  state,
  model,
  inputCompute,
  after,
  before,
  freeze,
  inputComputeClient,
  computed,
  modelClient
} from '../src/core'
import { setModelConfig } from '../src/util'

initModelConfig()

export function initModelConfig(obj: any = {}) {
  setModelConfig({
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
    async postDiffToServer(d) {},
    async postComputeToServer(c) {
      return []
    },
    async postQueryToServer (c) {
      return []
    },
    ...obj
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
export function oneModel(arg: { a: number }) {
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

  const changeS1 = inputComputeClient((v: number) => {
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
      entity: 'User',
      query: {}
    }),
    { immediate: true, pessimisticUpdate: true }
  )

  return {
    users
  }
}
export function userModelClient() {
  const num = state(0)
  const users = modelClient(
    () => ({
      entity: 'User',
      query: {
        where: {
          num: num(),
        }
      }
    }),
    { immediate: true, pessimisticUpdate: true }
  )

  return {
    users
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

// function a (x: number): {
//   (): number,
//   (a: string): string
// } {
//   return (v?: any): any => {
//     if (v) {
//       return v
//     }
//     return 0
//   }
// }
// const fn = a(1)
// const r = fn()
// const r2 = fn('a')

// const c: number = r + 1
