import {
  Runner,
  State
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('state', () => {
  it('use plain object', () => {
    const runner = new Runner(mockBM.plainObjectState)
    const args = [
      { num1: 0 },
      10
    ]
    const result = runner.init(...args)

    expect(result.s1()).toEqual(args[0])
    expect(result.s2()).toEqual(args[1])
  })
})