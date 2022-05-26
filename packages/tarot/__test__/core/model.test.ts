import { cloneDeep, IDiff, IQueryWhere, setEnv } from '../../src/util'
import {
  Runner,
  State
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('model', () => {

  beforeEach(() => {
    const mockUsersData = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]
    mockBM.initModelConfig({
      async find (e: string, w: IQueryWhere) {
        return cloneDeep(mockUsersData.slice())
      },
      async executeDiff (entity: string, diff: IDiff) {
        console.log('diff: ', diff.update);

        await mockBM.wait()

        diff.create.forEach((obj) => {
          mockUsersData.push(obj.value as any)
        })
        diff.update.forEach((obj) => {
          mockUsersData.forEach(o2 => {
            if (o2.id === obj.source?.id) {
              Object.assign(o2, obj.value)
            }
          })
        })
        diff.remove.forEach((obj: any) => {
          mockUsersData.filter(o2 => {
            return o2.id === obj.value.id
          })
        })

      }
    })
  })

  it('find immediate', async () => {
    const runner = new Runner(mockBM.userPessimisticModel)
    const result = runner.init()
    
    await mockBM.wait()

    expect(result.users()).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ])
  })

  describe('modify (default=server) ', () => {

    it('object:update property', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const result = runner.init()
      
      await mockBM.wait()

      const newName = 'updated a'

      result.users((draft: any) => {
        draft[0].name = newName
      })

      await mockBM.wait()

      expect(result.users()).toEqual([
        { id: 1, name: newName },
        { id: 2, name: 'b' },  
      ])
    })
    it('object:create', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const result = runner.init()
      
      await mockBM.wait()

      const newObj = { name: 'c', id: 3 }

      result.users((draft: any) => {
        draft.push(newObj)
      })

      await mockBM.wait()

      expect(result.users()).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },  
        newObj
      ])
    })
    it.only('object:remove', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const result = runner.init()
      
      await mockBM.wait()

      const newObj = { name: 'c', id: 3 }

      result.users((draft: any) => {
        draft.splice(0, 1)
      })

      await mockBM.wait()

      expect(result.users()).toEqual([
        { id: 2, name: 'b' },  
      ])
    })
    it ('array:create new element', async () => {
    })
    it ('array:remove element', async () => {
    })
  })
})