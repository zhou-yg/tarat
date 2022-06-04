import { cloneDeep, IDiff, IHookContext, IQueryWhere, set, setEnv } from '../../src/util'
import {
  Runner,
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('model', () => {

  beforeEach(() => {
    let mockUsersData = () => ([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ])
    mockBM.initModelConfig({
      async postQueryToServer (c: IHookContext) {
        console.log('c: ', c);
        return {
          initialArgList: [],
          name: 'userModelClient',
          data: [ [ 'data', 0 ], [ 'data', mockUsersData() ] ],
          index: 1,
          args: []
        }
      }
    })
  })

  it('post query to server', async () => {
    const runner = new Runner(mockBM.userModelClient)
    const result = runner.init()
    
    await mockBM.wait()

    expect(result.users()).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ])
  })
})