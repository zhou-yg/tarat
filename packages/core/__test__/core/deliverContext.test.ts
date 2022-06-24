import { Runner, IHookContext } from '../../src/index'

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
        ['state', { numStr: 'from context' }],
        ['state', null]
      ]
    }
    const runner = new Runner(mockBM.plainObjectState)
    const result = runner.init(args, context)

    expect(result.s1()).toEqual(context.data[0][1])
    expect(result.s2()).toEqual(context.data[1][1])
  })
  it('access state getter without context', () => {
    const args: [ {num1: number}, number ] = [
      { num1: 0 },
      10
    ]
    const context: IHookContext = {
      name: mockBM.plainObjectState.name,
      initialArgList: [],
      args: [],
      data: [
        ['state', { numStr: 'from context' }],
        ['state']
      ]
    }
    const runner = new Runner(mockBM.plainObjectState)
    const result = runner.init(args, context)

    expect(result.s1()).toEqual(context.data[0][1])

    try {
      result.s2()
    } catch (e: any) {
      expect(e.message).toBe('[update getter] cant access un initialized hook(1)')
    }
  })
  it('access model getter without context', () => {
    const context: IHookContext = {
      name: mockBM.plainObjectState.name,
      initialArgList: [],
      args: [],
      data: [
        ['model']
      ]
    }
    const runner = new Runner(mockBM.oneModel)
    const result = runner.init([], context)

    try {
      result.m1()
    } catch (e: any) {
      expect(e.message).toBe('[update getter] cant access un initialized hook(0)')
    }
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