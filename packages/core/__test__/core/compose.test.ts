import { Runner, IHookContext, State, Computed } from '../../src/index'
import * as mockBM from '../mockBM'

describe('compose', () => {

  it('compose one', () => {

    const runner = new Runner(mockBM.composeWithSS)
    runner.init()

    const { hooks, composes } = runner.scope

    expect(hooks.length).toBe(4)
    expect(composes.length).toBe(1)

    expect(hooks[0]?.watchers.has((hooks[3] as Computed<any>).watcher)).toBeTruthy()
    expect(hooks[0]?.watchers.size).toBe(2)
    expect(hooks[1]?.watchers.has((hooks[2] as Computed<any>).watcher)).toBeTruthy()
    expect(hooks[1]?.watchers.size).toBe(2)
  })

  it ('compose multi same hooks', () => {
    const runner = new Runner(mockBM.composeWithSS2)
    runner.init()

    const { hooks, composes } = runner.scope

    expect(hooks.length).toBe(7)
    expect(composes.length).toBe(2)
    
    expect(hooks[0]?.watchers.has((hooks[6] as Computed<any>).watcher)).toBeTruthy()
    expect(hooks[1]?.watchers.has((hooks[6] as Computed<any>).watcher)).toBeTruthy()
    expect(hooks[5]?.watchers.has((hooks[6] as Computed<any>).watcher)).toBeTruthy()
  })
})