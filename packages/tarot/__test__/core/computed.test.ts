import { IHookContext } from 'packages/tarot/src/util'
import {
  Computed,
  CurrentRunnerScope,
  Runner,
  State
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

    console.log('result.s._state.listeners:', result.s._state.listeners['']);
    expect(result.s._state).toBeInstanceOf(State)
    expect(result.s._state.listeners[''].length).toBe(2)
    expect(result.s._state.listeners[''][0]).toBe(runner.scope.watcher)
    expect(result.s._state.listeners[''][1]).toBe(result.c._state.watcher)
  })
  it('use primitive state, change on time', async () => {
    const num1 = 1
    const num2 = 2
    const runner = new Runner(mockBM.onePrimitiveStateComputed)
    const result = runner.init(num1, num2)

    expect(result.c()).toBe(num1 + num2)

    expect(runner.scope.hooks.length).toBe(2)
    expect((runner.scope.hooks[1] as State).listeners['']?.length).toBe(1)

    result.s((v: number) => v + 1)
    await mockBM.wait()

    expect(result.c()).toBe(num1 + num2 + 1)
    expect(result.s._state.listeners[''].length).toBe(2)
    expect(result.s._state.listeners[''][0]).toBe(runner.scope.watcher)
    expect(result.s._state.listeners[''][1]).toBe(result.c._state.watcher)
  })
})
