import { IHookContext } from '../../src/index'
import {
  Runner,
} from '../../src/'

import * as mockBM from '../mockBM'

describe('initContext', () => {
  it('init context to state', () => {
    const args: [ {num1: number}, number ] = [
      { num1: 0 },
      10
    ]
    const context: IHookContext = {
      name: mockBM.plainObjectState.name,
      initialArgList: [],
      args: [],
      data: [
        ['data', { numStr: 'from context' }],
        ['data', null]
      ]
    }
    const runner = new Runner(mockBM.plainObjectState)
    const result = runner.init(args, context)

    expect(result.s1()).toEqual(context.data[0][1])
    expect(result.s2()).toEqual(context.data[1][1])
  })
  it('callHook remote', async () => {

    mockBM.initModelConfig({
      async postComputeToServer (c: IHookContext) {
        process.env.TARGET = 'server'
        const serverRunner = new Runner(mockBM.changeStateInputComputeServer)
        serverRunner.init(c.initialArgList as [any, any], c)

        if (c.index) {
          await serverRunner.callHook(c.index, c.args)
        }
        const context = serverRunner.scope.createInputComputeContext()

        process.env.TARGET = ''

        return context
      }
    })
    const args: [ {num1: number}, number ] = [
      { num1: 0 },
      1
    ]
    const clientRunner = new Runner(mockBM.changeStateInputComputeServer)
    const r = clientRunner.init(args)

    expect(r.s1()).toEqual(args[0])
    expect(r.s2()).toEqual(args[1])

    const newVal = 10
    await r.changeS1(newVal)

    expect(r.s1()).toEqual({ num1: newVal })
    expect(r.s2()).toEqual(args[1])
  })
})