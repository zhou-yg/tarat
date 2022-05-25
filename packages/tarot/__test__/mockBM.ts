import {
  state,
  model,
  inputCompute,
  after,
} from '../src/core'
import {
  setModelConfig
} from '../src/util'

setModelConfig({
  async find (e, w) {
    return []
  },
  async update (e, w) {
    return []
  },
  async remove (e, d) {
    return []
  },
  async create (e, d) {
    return {}
  },
  async executeDiff (d) {

  },
  async postDiffToServer (d) {
  },
  async postComputeToServer (c) {
    return []
  }
})

export function blank() {}
export function returnArg(arg: any) {
  return arg
}
export function oneState (arg: { a: number }) {
  const s1 = state(arg.a)
  
  return {
    s1
  }
}
export function oneModel (arg: { a: number }) {
  const m1 = model(
    () => ({
      entity: 'test-model',
      where: {

      }
    })
  )
  return {
    m1
  }
}
export function oneCompute (arg: { a: number }) {
  const f1 = inputCompute((arg: any) => {

  })
  return {
    f1
  }
}
export function oneEffect (arg: {
  a: number,
  s1Changed: Function
}) {

  const stateBM = oneState(arg)

  after(
    () => {
      arg.s1Changed()
    },
    [stateBM.s1]
  )

  return {
    s1: stateBM.s1
  }
}

export function plainObjectState (obj1: { num1: number }, num2: number) {
  const s1 = state<{ num1: number }>(obj1)
  const s2 = state(num2)

  return {
    s1,
    s2
  }
}

export function changeStateInputCompute (obj1: { num1: number }, num2: number) {
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
