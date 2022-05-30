import { cloneDeep, IHookContext } from '../../src/util'
import {
  Runner,
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('inputCompute', () => {
  it('change state in inputCompute', async () => {
    const runner = new Runner(mockBM.changeStateInputCompute)

    const onRunnerUpdate = jest.fn(() => {
    })
    runner.onUpdate(onRunnerUpdate)

    const args: [object, number] = [
      { num1: 0 },
      10
    ]

    const initResult = runner.init(...args)

    const newVal1 = 2

    initResult.changeS1(newVal1)

    expect(initResult.s1()).toEqual({ num1: newVal1 })
    expect(onRunnerUpdate).toHaveBeenCalledTimes(0)

    await mockBM.wait()

    expect(onRunnerUpdate).toHaveBeenCalledTimes(1)

    const newVal2 = 3
    initResult.changeS1(newVal2, newVal2)

    expect(initResult.s1()).toEqual({ num1: newVal2 })
    expect(initResult.s2()).toEqual(args[1] + newVal2)  
    expect(onRunnerUpdate).toHaveBeenCalledTimes(1)

    await mockBM.wait()

    expect(onRunnerUpdate).toHaveBeenCalledTimes(1 + 1)
  })
  it('async inputCompute', async () => {
    const runner = new Runner(mockBM.changeStateAsyncInputCompute)

    const onRunnerUpdate = jest.fn(() => {
    })
    runner.onUpdate(onRunnerUpdate)

    const args: [object, number] = [
      { num1: 0 },
      10
    ]

    const initResult = runner.init(...args)

    const newVal1 = 2

    await initResult.changeS1(newVal1)
    
    await mockBM.wait()

    expect(initResult.s1()).toEqual({ num1: newVal1 })
    expect(onRunnerUpdate).toHaveBeenCalledTimes(1)

    const newVal2 = 3
    
    await initResult.changeS1(newVal2, newVal2)

    await mockBM.wait()

    expect(initResult.s1()).toEqual({ num1: newVal2 })
    expect(initResult.s2()).toEqual(args[1] + newVal2)
    
    expect(onRunnerUpdate).toHaveBeenCalledTimes(2)
  })

  it('post inputCompute to Server', async () => {
    const runner = new Runner(mockBM.changeStateInputComputeServer)

    const onRunnerUpdate = jest.fn(() => {
    })
    runner.onUpdate(onRunnerUpdate)

    mockBM.initModelConfig({
      async postComputeToServer (c: IHookContext) {
        let { data, index, args } = c

        expect(data).toEqual([
          ['data', initArgs[0]],
          ['data', 10],
          ['inputCompute', null]
        ])

        expect(index).toBe(2)

        expect(args).toEqual([newVal1])

        data = cloneDeep(data)
        data[0][1] = { num1: args?.[0] }

        return {
          data
        }
      }  
    })

    const initArgs: [object, number] = [
      { num1: 0 },
      10
    ]
    const initResult = runner.init(...initArgs)
    let newVal1 = 2

    await initResult.changeS1(newVal1)
    
    expect(initResult.s1()).toEqual({ num1: newVal1 })
    expect(onRunnerUpdate).toHaveBeenCalledTimes(0)

    await mockBM.wait()

    expect(onRunnerUpdate).toHaveBeenCalledTimes(1)  
  })
})