import {
  Runner,
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('effect', () => {
  it('before inputCompute with freeze', async () => {
    const runner = new Runner(mockBM.beforeWithFreeze)
    const onRunnerUpdate = jest.fn(() => {
    })
    runner.onUpdate(onRunnerUpdate)

    const initNum = 0
    const result = runner.init([initNum])

    expect(result.num()).toBe(initNum)
    expect(result.markBefore).toEqual({ value: 0 })
    expect(runner.scope.hooks.length).toBe(3)

    const plusValue = 2
    result.addNum(plusValue)

    await mockBM.wait()

    expect(result.num()).toBe(initNum + plusValue)
    expect(result.markBefore).toEqual({ value: 1 })
    expect(onRunnerUpdate).toHaveBeenCalledTimes(1)

    result.addNum(plusValue)

    await mockBM.wait()

    expect(result.num()).toBe(initNum + plusValue)
    expect(result.markBefore).toEqual({ value: 2 })
    expect(onRunnerUpdate).toHaveBeenCalledTimes(1)
  })
  it('after inputCompute', async () => {
    const runner = new Runner(mockBM.effectAfter)
    const onRunnerUpdate = jest.fn(() => {
    })
    runner.onUpdate(onRunnerUpdate)
  
    const initNum = 0
    const result = runner.init([initNum])

    expect(result.num()).toBe(initNum)
    expect(result.markBefore).toEqual({ value: 0 })
    expect(runner.scope.hooks.length).toBe(3)

    const plusValue = 2
    result.addNum(plusValue)

    await mockBM.wait()

    expect(result.num()).toBe(initNum + plusValue)
    expect(result.markBefore).toEqual({ value: 1 })
    expect(onRunnerUpdate).toHaveBeenCalledTimes(1)  
  })
})