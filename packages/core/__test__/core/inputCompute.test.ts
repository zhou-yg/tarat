import { Runner, cloneDeep, IHookContext } from '../../src/index'

import * as mockBM from '../mockBM'

describe('inputCompute', () => {
  it('change state in inputCompute', async () => {
    const runner = new Runner(mockBM.changeStateInputCompute)

    const onRunnerUpdate = jest.fn(() => {
    })

    const args: [any, number] = [
      { num1: 0 },
      10
    ]

    const initResult = runner.init(args)
    runner.scope.onUpdate(onRunnerUpdate)

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
  it('access inputCompute draft', () => {
    const runner = new Runner(mockBM.changeMultiByInputCompute)
    const onRunnerUpdate = jest.fn(() => {
    })
    const { s1, changeS1 } = runner.init()
    runner.scope.onUpdate(onRunnerUpdate)

    expect(s1().num).toBe(0)
    changeS1(6)
    

    expect(s1().num).toBe(10)
    changeS1(4)

    expect(s1().num).toBe(-10)
  })
  it('bad case: async/await inputCompute', async () => {
    const runner = new Runner(mockBM.changeStateAsyncInputCompute)

    const onRunnerUpdate = jest.fn(() => {
    })

    const args: [any, number] = [
      { num1: 0 },
      10
    ]

    const initResult = runner.init(args)
    runner.scope.onUpdate(onRunnerUpdate)

    const newVal1 = 2

    await initResult.changeS1(newVal1)
    
    await mockBM.wait()

    // the draft in inputCompute will commit at the last in this case
    expect(initResult.s1()).not.toEqual({ num1: newVal1 })
    expect(onRunnerUpdate).toHaveBeenCalledTimes(1)

    const newVal2 = 3
    
    await initResult.changeS1(newVal2, newVal2)

    await mockBM.wait()

    expect(initResult.s1()).not.toEqual({ num1: newVal2 })
    expect(initResult.s2()).toEqual(args[1] + newVal2)
    
    expect(onRunnerUpdate).toHaveBeenCalledTimes(2)
  })
  it('good case: generator inputCompute', async () => {
    const runner = new Runner(mockBM.changeStateGeneratorInputCompute)

    const onRunnerUpdate = jest.fn(() => {
    })

    const args: [any, number] = [
      { num1: 0 },
      10
    ]

    const initResult = runner.init(args)
    runner.scope.onUpdate(onRunnerUpdate)

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
})