import { cloneDeep, IDiff, IQueryWhere, set, setEnv } from '../../src/util'
import {
  Runner,
} from '../../src/core'

import * as mockBM from '../mockBM'
import prisma, { clearAll } from '../prisma'

describe('model', () => {
  beforeAll(() => {
    process.env.TARGET = 'server'
    clearAll()
  })
  beforeEach(async () => {
    await prisma.item.deleteMany({})
    const mockUsersData = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]
    for (const data of mockUsersData) {
      await prisma.item.create({
        data
      })  
    }
    mockBM.initModelConfig({
      async find (e: 'item', w: IQueryWhere) {
        return prisma[e].findMany(w as any)
      },
      async executeDiff (entity: 'item', diff: IDiff) {
        await Promise.all(diff.create.map(async (obj) => {
          await prisma[entity].create({
            data: obj.value as any
          })
        }))
        await Promise.all(diff.update.map(async (obj) => {
          await prisma[entity].update({
            where: { id: obj.source.id },
            data: obj.value
          })
        }))
        await Promise.all(diff.remove.map(async (obj) => {
          await prisma[entity].delete({
            where: { id: obj.value.id },
          })
        }))
      }
    })
  })
  afterAll(() => {
    process.env.TARGET = ''
  })

  it('find immediate', async () => {
    const runner = new Runner(mockBM.userPessimisticModel)
    const result = runner.init()
    
    expect(await result.users()).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ])
  })

  describe('modify (default=server) ', () => {

    it('object:update property', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const result = runner.init()
      
      const newName = 'updated a'

      await result.users((draft: any) => {
        draft[0].name = newName
      })

      const users = await result.users()
      expect(users).toEqual([
        { id: 1, name: newName },
        { id: 2, name: 'b' },  
      ])
    })
    it('object:create child', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const result = runner.init()
      

      // @TODO: 增加relation的关联CRUD
      // const childObj = { name: 'child' }
      // await result.users((draft: any) => {
      //   draft[1].child = childObj
      // })
      // const users = await result.users()
      // expect(users).toEqual([
      //   { id: 1, name: 'a' },
      //   { id: 2, name: 'b', childObj: { ...childObj, id: 1 } },
      // ])
    })
    it( 'object:remove property', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const result = runner.init()

      await result.users((draft: any) => {
        delete draft[1].name
      })

      expect(await result.users()).toEqual([
        { id: 1, name: 'a' },  
        { id: 2, name: null },  
      ])
    })
    it('array:create new element', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const result = runner.init()
      
      await mockBM.wait()

      const newObj = { name: 'c', id: 3 }

      await result.users((draft: any) => {
        draft.push(newObj)
      })

      const users = await result.users()

      expect(users).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        newObj
      ])
    })
    it('array:remove element', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const result = runner.init()

      await result.users((draft: any) => {
        draft.splice(0, 1)
      })

      expect(await result.users()).toEqual([
        { id: 2, name: 'b' },  
      ])
    })
  })
})