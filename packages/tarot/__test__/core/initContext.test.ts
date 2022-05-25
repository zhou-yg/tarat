import {
  IHookContextData,
  Runner,
  State
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('initContext', () => {
  it('init context to state', () => {
    const args = [
      { num1: 0 },
      10
    ]
    const context: IHookContextData = [
      ['data', { numStr: 'from context' }],
      ['data', null]
    ]
    const runner = new Runner(mockBM.plainObjectState, context)
    const result = runner.init(...args)

    expect(result.s1()).toEqual(context[0][1])
    expect(result.s2()).toEqual(context[1][1])
  })
})