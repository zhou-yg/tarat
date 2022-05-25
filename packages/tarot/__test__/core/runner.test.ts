import {
  Runner,
  State
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('runner basic', () => {

  it('run blank', () => {
    const runner = new Runner(mockBM.blank)
    const initResult = runner.init()

    expect(initResult).toEqual(undefined)
    expect(runner.scope.hooks).toStrictEqual([])
  })
  it('run returnArg', () => {
    const runner = new Runner(mockBM.returnArg)

    const arg = { a: 1 }

    const initResult = runner.init(arg)

    expect(initResult).toEqual(arg)
    expect(runner.scope.hooks).toStrictEqual([])
  })
  it('run oneState', () => {
    const runner = new Runner(mockBM.oneState)

    const arg = { a: 1 }

    const initResult = runner.init(arg)

    expect(initResult.s1()).toEqual(arg.a)
    expect(runner.scope.hooks.length).toStrictEqual(1)
    expect((runner.scope.hooks[0] as State).value).toBe(arg.a)
  })
  it('run oneModel', () => {
    const runner = new Runner(mockBM.oneModel)

    const arg = { a: 1 }

    const initResult = runner.init(arg)

    expect(initResult.m1()).toBe(undefined)
    expect(runner.scope.hooks.length).toBe(1)
    expect((runner.scope.hooks[0] as State).value).toBe(undefined)
  })
  it('run oneCompute', () => {
    const runner = new Runner(mockBM.oneCompute)

    const initResult = runner.init()

    expect(typeof initResult.f1).toBe('function')
    expect(runner.scope.hooks.length).toBe(1)
  })
  it('run oneEffect with nested BM', () => {
    const runner = new Runner(mockBM.oneEffect)

    const onRunnerUpdate = jest.fn(() => {
    })
    runner.onUpdate(onRunnerUpdate)

    const arg = {
      a: 1,
      s1Changed: jest.fn(() => {
      })
    }

    const initResult = runner.init(arg)

    expect(initResult.s1()).toBe(arg.a)
    expect(runner.scope.hooks.length).toBe(1)
    expect(runner.scope.dataSetterGetterMap.size).toBe(1)
    expect(runner.scope.internalListeners.length).toBe(1)
    expect(runner.scope.internalListeners[0][1].after.length).toBe(1)
    
    expect(onRunnerUpdate).toHaveBeenCalledTimes(0)

    initResult.s1((draft: number) => draft + 1)
  
    expect(initResult.s1()).toBe(2)
    expect(arg.s1Changed).toHaveBeenCalledTimes(1)
    expect(onRunnerUpdate).toHaveBeenCalledTimes(1)
  })
})