import { IHookContext } from '../../src/util'
import {
  Runner,
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('initContext', () => {
  it('init context to state', () => {
    const args = [
      { num1: 0 },
      10
    ]
    const context: IHookContext = {
      data: [
        ['data', { numStr: 'from context' }],
        ['data', null]
      ]
    }
    const runner = new Runner(mockBM.plainObjectState, context)
    const result = runner.init(...args)

    expect(result.s1()).toEqual(context.data[0][1])
    expect(result.s2()).toEqual(context.data[1][1])
  })
})