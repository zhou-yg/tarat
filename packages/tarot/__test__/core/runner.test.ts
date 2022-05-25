import {
  Runner
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('runner basic', () => {

  it('run blank', () => {
    const runner = new Runner(mockBM.blank)
    const initResult = runner.init()

    expect(initResult).toEqual(undefined)
    expect(runner.scope.hooks).toStrictEqual([])
  })
})