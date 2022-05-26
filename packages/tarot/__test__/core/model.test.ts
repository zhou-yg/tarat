import { IQueryWhere, setEnv } from '../../src/util'
import {
  Runner,
  State
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('model', () => {

  beforeEach(() => {
    const mockUsersData = [
      {
        id: 1, name: 'a'
      },
      {
        id: 2, name: 'b'
      },
    ]
    mockBM.initModelConfig({
      async find (e: string, w: IQueryWhere) {
        return mockUsersData.slice()
      }
    })
  })

  it('find immediate', async () => {
    const runner = new Runner(mockBM.userModel)
    const result = runner.init()
    
    await mockBM.wait()

    expect(result.users()).toEqual([
      {
        id: 1, name: 'a'
      },
      {
        id: 2, name: 'b'
      },
    ])
  })

  describe('modify (default=server) ', () => {

    it.only('object:update property', async () => {
      const runner = new Runner(mockBM.userModel)
      const result = runner.init()
      
      await mockBM.wait()

      const newName = 'updated a'

      result.users((draft: any) => {
        draft[0].name = newName
      })
    })
    it ('object:create', async () => {
    })
    it ('object:remove', async () => {
    })
    it ('array:create new element', async () => {
    })
    it ('array:remove element', async () => {
    })
  })
})