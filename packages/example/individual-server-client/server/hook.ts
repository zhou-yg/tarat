import {
  inputCompute,
  state
} from '@tarot-run/core'

export default function hook () {
  const s1 = state(1)
  const s2 = state(2)
  
  const add = inputCompute((v) => {
    s1(d => d + v)
    s2(d => d + v)
  })
  
  return {
    s1,
    s2,
    add
  }
}
