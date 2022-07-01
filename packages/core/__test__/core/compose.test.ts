import { Runner, IHookContext } from '../../src/index'
import * as mockBM from '../mockBM'

describe('compose', () => {

  it('compose one', () => {

    const runner = new Runner(mockBM.composeWithSS)
    runner.init()

    expect(runner.scope.hooks.length).toBe(4)

    
  })
})