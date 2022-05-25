import {
  IHookContextData,
  Runner,
  State
} from '../../src/core'

import * as mockBM from '../mockBM'

describe.only('inputCompute', () => {
  it('change state in inputCompute', () => {
    const runner = new Runner(mockBM.changeStateInputCompute)

    const onRunnerUpdate = jest.fn(() => {
    })
    runner.onUpdate(onRunnerUpdate)

    const args = [
      { num1: 0 },
      10
    ]

    const initResult = runner.init(...args)

    const newVal1 = 2

    initResult.changeS1(newVal1)
    
    expect(initResult.s1()).toEqual({ num1: newVal1 })
    expect(onRunnerUpdate).toHaveBeenCalledTimes(1)
  })
})