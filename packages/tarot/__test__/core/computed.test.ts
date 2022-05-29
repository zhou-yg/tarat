import { IHookContext } from 'packages/tarot/src/util'
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

    expect(result.s._state.watchers.size).toBe(2)
    expect(result.s._state.watchers.has(runner.scope.watcher)).toBe(true)
    expect(result.s._state.watchers.has(result.c._state.watcher)).toBe(true)
  })
  it('use primitive state, change on time', async () => {
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
    expect(result.s._state.watchers.size).toBe(2)
    expect(result.s._state.watchers.has(runner.scope.watcher)).toBe(true)
    expect(result.s._state.watchers.has(result.c._state.watcher)).toBe(true)
  })
})
