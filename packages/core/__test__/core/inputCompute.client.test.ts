import { Runner, cloneDeep, IHookContext } from '../../src/index'

import * as mockBM from '../mockBM'

describe('inputCompute', () => {

  it('post inputCompute to Server', async () => {
    const runner = new Runner(mockBM.changeStateInputComputeServer)

    const onRunnerUpdate = jest.fn(() => {
    })
    runner.onUpdate(onRunnerUpdate)

    mockBM.initModelConfig({
      async postComputeToServer (c: IHookContext) {
        process.env.TARGET = 'server'
        const runner = new Runner(mockBM.changeStateInputComputeServer)

        runner.init(c.initialArgList as [any, any], c)

        if (c.index) {
          await runner.callHook(c.index, c.args)
        }

        process.env.TARGET = ''
        return runner.scope.createInputComputeContext()
      }  
    })

    const initArgs: [any, number] = [
      { num1: 0 },
      10
    ]
    const initResult = runner.init(initArgs)
    let newVal1 = 2

    await initResult.changeS1(newVal1)
    
    expect(initResult.s1()).toEqual({ num1: newVal1 })
    expect(onRunnerUpdate).toHaveBeenCalledTimes(0)

    await mockBM.wait()

    expect(onRunnerUpdate).toHaveBeenCalledTimes(1)  
  })
})