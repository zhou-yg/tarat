import { Runner, cloneDeep, getPlugin, IDiff, IHookContext, IQueryWhere, set, setEnv,
  startdReactiveChain,
  stopReactiveChain,
  State,
  Computed
} from '../../src/index'

import * as mockBM from '../mockBM'


describe('chain', () => {

  afterEach(() => {
    stopReactiveChain()
  })

  it ('state -> computed', () => {

    const runner = new Runner(mockBM.stateInComputed)
    const { s2, c1 } = runner.init()

    const chain = startdReactiveChain()

    s2(v => v + 1)

    expect(s2()).toBe(2)
    expect(c1()).toBe(3)
    
    // root
    expect(chain.state).toBe(undefined)
    expect(chain.children.length).toBe(1)
    // state
    expect(chain.children[0].state).toBeInstanceOf(State)
    expect(chain.children[0].oldValue).toBe(1)
    expect(chain.children[0].newValue).toBe(2)
    // computed
    expect(chain.children[0].children.length).toBe(1)
    expect(chain.children[0].children[0].state).toBeInstanceOf(Computed)
  })
})
