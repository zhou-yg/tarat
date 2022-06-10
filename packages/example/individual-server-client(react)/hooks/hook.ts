import {
  inputCompute,
  state
} from 'tarat-core'

export default function hook () {
  const s1 = state({ num: 0 })
  const s2 = state(2)
  
  const add = inputCompute((v) => {
    s1(d => {
      d.num += v
    })
    s2(d => d + v)
  })
  
  return {
    s1,
    s2,
    add
  }
}
