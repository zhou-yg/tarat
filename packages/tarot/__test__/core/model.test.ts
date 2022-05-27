import { cloneDeep, IDiff, IQueryWhere, set, setEnv } from '../../src/util'
import {
  Runner,
  State
} from '../../src/core'

import * as mockBM from '../mockBM'

describe('model', () => {

  beforeEach(() => {
    let mockUsersData = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]
    mockBM.initModelConfig({
      async find (e: string, w: IQueryWhere) {
        return cloneDeep(mockUsersData.slice())
      },
      async executeDiff (entity: string, diff: IDiff) {
        await mockBM.wait()

        diff.create.forEach((obj) => {
          if (obj.currentFieldPath) {
            const target = mockUsersData.find(u => u.id === obj.source.id)
            set(target, obj.currentFieldPath, obj.value)
          } else {
            mockUsersData.push(obj.value as any)
          }
        })
        diff.update.forEach((obj) => {
          mockUsersData.forEach(o2 => {
            if (o2.id === obj.source?.id) {
              Object.assign(o2, obj.value)
            }
          })
        })
        diff.remove.forEach((obj: any) => {
          mockUsersData = mockUsersData.filter(o2 => {
            return o2.id !== obj.value.id
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

      const newObj = { name: 'c', id: 3, child: true }

      result.users((draft: any) => {
        draft[0].child = newObj
      })

      await mockBM.wait()

      expect(result.users()).toEqual([
        { id: 1, name: 'a', child: newObj },
        { id: 2, name: 'b' },
      ])
    })
    it('object:remove property', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const result = runner.init()
      
      await mockBM.wait()

      result.users((draft: any) => {
        delete draft[1].name
      })

      await mockBM.wait()

      expect(result.users()).toEqual([
        { id: 1, name: 'a' },  
        { id: 2, name: null },  
      ])
    })
    it('array:create new element', async () => {
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
    it ('array:remove element', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const result = runner.init()
      
      await mockBM.wait()

      result.users((draft: any) => {
        draft.splice(0, 1)
      })

      await mockBM.wait()

      expect(result.users()).toEqual([
        { id: 2, name: 'b' },  
      ])
    })
  })
})