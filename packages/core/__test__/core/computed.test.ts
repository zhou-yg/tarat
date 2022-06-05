import {
  Runner,
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('computed', () => {
  it('blank', () => {
    const cv = 1
    const runner = new Runner(mockBM.blankComputed)
    const result = runner.init(cv)

    expect(result.c()).toBe(cv)
  })
  it('use primitive state', async () => {
    const num1 = 1
    const num2 = 2
    const runner = new Runner(mockBM.onePrimitiveStateComputed)
    const result = runner.init(num1, num2)

    expect(result.c()).toBe(num1 + num2)

    expect(result.s._hook.watchers.size).toBe(2)
    expect(result.s._hook.watchers.has(runner.scope.watcher)).toBe(true)
    expect(result.s._hook.watchers.has(result.c._hook.watcher)).toBe(true)
  })
  it('use primitive state, change one time', async () => {
    const num1 = 1
    const num2 = 2
    const runner = new Runner(mockBM.onePrimitiveStateComputed)
    const result = runner.init(num1, num2)

    expect(result.c()).toBe(num1 + num2)

    expect(runner.scope.hooks.length).toBe(2)
    expect((runner.scope.hooks[1]).watchers.size).toBe(1)

    result.s((v: number) => v + 1)
    await mockBM.wait()

    expect(result.c()).toBe(num1 + num2 + 1)
    expect(result.s._hook.watchers.size).toBe(2)
    expect(result.s._hook.watchers.has(runner.scope.watcher)).toBe(true)
    expect(result.s._hook.watchers.has(result.c._hook.watcher)).toBe(true)
  })
  it.only('use array', async () => {
    const runner = new Runner(mockBM.computedWithArray)
    const result = runner.init()

    expect(result.arr()).toEqual([0,1,2,3,4,5,6,7,8,9])
    expect(result.guard()).toBe(2)
    expect(result.arr2()).toEqual([0, 1])
    
    result.guard((d: number) => d + 1)
    await mockBM.wait()
    
    expect(result.arr()).toEqual([0,1,2,3,4,5,6,7,8,9])
    expect(result.guard()).toBe(3)
    expect(result.arr2()).toEqual([0, 1, 2])
  })
})
