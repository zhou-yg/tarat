import { cloneDeep, IDiff, IHookContext, IQueryWhere, set, setEnv } from '../../src/index'
import {
  Runner,
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('client model', () => {

  beforeEach(() => {
    let mockUsersData = () => ([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ])
    let times = 0
    mockBM.initModelConfig({
      async postQueryToServer (c: IHookContext) {
        times++
        if (times > 3) {
          console.log('times: ', times);
          throw new Error('times > 3')
        }
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

    expect(await result.users()).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ])
  })
})