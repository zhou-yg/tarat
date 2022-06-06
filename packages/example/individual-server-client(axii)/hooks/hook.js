import {
  inputCompute,
  inputComputeInServer,
  state
} from '@tarot-run/core'

export default function hook () {
  const s1 = state({ num: 0 })
  const s2 = state(2)
  
  const add = inputComputeInServer((v) => {
    s1(d => {
      d.num += v
    })
    s2(d => {
      return d + v
    })
  })
  
  return {
    s1,
    s2,
    add
  }
}
