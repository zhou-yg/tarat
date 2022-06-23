import {
  Runner,
  startdReactiveChain,
  stopReactiveChain,
  State,
  Computed,
  InputCompute,
} from '../../src/index'

import * as mockBM from '../mockBM'


describe('chain', () => {

  afterEach(() => {
    stopReactiveChain()
  })

  it ('state -> 1 computed', () => {
    const runner = new Runner(mockBM.stateInComputed)
    const { s2, c1 } = runner.init()

    const chain = startdReactiveChain()

    s2(v => v + 1)

    expect(s2()).toBe(2)
    expect(c1()).toBe(3)
    
    // root
    expect(chain.hook).toBe(undefined)
    expect(chain.children.length).toBe(1)
    // state
    expect(chain.children[0].hook).toBeInstanceOf(State)
    expect(chain.children[0].oldValue).toBe(1)
    expect(chain.children[0].newValue).toBe(2)
    // computed
    expect(chain.children[0].children.length).toBe(1)
    expect(chain.children[0].children[0].hook).toBeInstanceOf(Computed)
  })
  it ('state -> nested computed', () => {
    const runner = new Runner(mockBM.stateInNestedComputed)
    const { s2, c1, c2 } = runner.init()

    const chain = startdReactiveChain()

    s2(v => v + 1)

    expect(s2()).toBe(2)
    expect(c1()).toBe(3)
    expect(c2()).toBe(4)
    
    // root
    expect(chain.hook).toBe(undefined)
    expect(chain.children.length).toBe(1)
    // state
    expect(chain.children[0].hook).toBeInstanceOf(State)
    expect(chain.children[0].oldValue).toBe(1)
    expect(chain.children[0].newValue).toBe(2)
    // computed c1
    expect(chain.children[0].children.length).toBe(1)
    expect(chain.children[0].children[0].hook).toBeInstanceOf(Computed)
    expect(chain.children[0].children[0].oldValue).toBe(2)
    expect(chain.children[0].children[0].newValue).toBe(3)
    // computed c2
    expect(chain.children[0].children[0].children.length).toBe(1)
    expect(chain.children[0].children[0].children[0].hook).toBeInstanceOf(Computed)
    expect(chain.children[0].children[0].children[0].oldValue).toBe(3)
    expect(chain.children[0].children[0].children[0].newValue).toBe(4)
  })

  it ('inputCompute -> state', () => {
    const runner = new Runner(mockBM.statesWithInputCompute)
    const { s1, s2, c1, c2, ic } = runner.init()

    const chain = startdReactiveChain()
    ic()

    // root
    expect(chain.hook).toBe(undefined)
    expect(chain.children.length).toBe(1)
    // ic
    expect(chain.children[0].hook).toBeInstanceOf(InputCompute)
    expect(chain.children[0].children.length).toBe(2)
    // s1 & s2
    expect(chain.children[0].children[0].hook).toBeInstanceOf(State)
    expect(chain.children[0].children[0].children.length).toEqual(1)

    expect(chain.children[0].children[1].hook).toBeInstanceOf(State)
    expect(chain.children[0].children[1].children.length).toBe(1)
    // c1
    expect(chain.children[0].children[1].children[0].hook).toBeInstanceOf(Computed)
    expect(chain.children[0].children[1].children[0].children.length).toBe(1)
    expect(chain.children[0].children[1].children[0].children[0].hook).toBeInstanceOf(Computed)
    expect(chain.children[0].children[1].children[0].children[0].children).toEqual([])

    // chain.print()
  })
})
