import {
  Runner,
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('state', () => {
  it('use plain object', () => {
    const runner = new Runner(mockBM.plainObjectState)
    const args: [{num1: number}, number] = [
      { num1: 0 },
      10
    ]
    const result = runner.init(args)

    expect(result.s1()).toEqual(args[0])
    expect(result.s2()).toEqual(args[1])
  })
  it('watch state changing', () => {
    const runner = new Runner(mockBM.plainObjectState)
    const args: [{num1: number}, number] = [
      { num1: 0 },
      10
    ]
    const result = runner.init(args)

    

    expect(result.s1()).toEqual(args[0])
    expect(result.s2()).toEqual(args[1])
  })
})