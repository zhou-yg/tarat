import { cloneDeep, IHookContext } from '../../src/index'
import {
  Runner,
} from '../../src/'

import * as mockBM from '../mockBM'

describe('inputCompute', () => {

  it('post inputCompute to Server', async () => {
    const runner = new Runner(mockBM.changeStateInputComputeServer)

    const onRunnerUpdate = jest.fn(() => {
    })
    runner.onUpdate(onRunnerUpdate)

    mockBM.initModelConfig({
      async postComputeToServer (c: IHookContext) {
        let { data, index, args } = c

        expect(data).toEqual([
          ['state', initArgs[0]],
          ['state', 10],
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