import { Runner, cloneDeep, debuggerLog, IDiff, IHookContext, IQueryWhere, set, setEnv } from '../../src/index'

import * as mockBM from '../mockBM'
import prisma, { clearAll } from '../prisma'

describe('model', () => {
  beforeAll(() => {
    // make sure the model run in server envirnment
    process.env.TARGET = 'server'
    clearAll()
  })
  afterAll(() => {
    process.env.TARGET = ''
  })
  beforeEach(async () => {
    await prisma.item.deleteMany({})
    const r = await prisma.item.findMany({})
    if (r.length > 0) {
      await prisma.item.deleteMany({})
      const r2 = await prisma.item.findMany({})
      if (r2.length > 0) {
        throw new Error('prisma.item.deleteMany fail')
      }
    }

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
          const r = await prisma[entity].create({
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
  describe('mount model', () => {
  
    it('find immediate', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const result = runner.init()
      
      await runner.ready()

      expect(result.users()).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ])
    })
  
    it('check exist before create', async () => {
      const runner = new Runner(mockBM.userModelInputeCompute)
      const result = runner.init()
      
      result.createItem(3, 'a')
      await runner.ready()
      expect(await result.items()).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ])
  
      await result.createItem(3, 'c')
      await runner.ready()
  
      const r2 = await result.items()
      
  
      expect(r2).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ])
    })
  
    it('query where computed', async () => {
      const runner = new Runner(mockBM.userModelComputedQuery)
      const result = runner.init()
      await runner.ready()
      expect(result.users()).toEqual([])
  
      result.targetName(() => 'a')
      await runner.ready()
      expect(result.users()).toEqual([{ id: 1, name: 'a' }])
  
      result.targetName(() => 'b')
      await runner.ready()
      expect(result.users()).toEqual([{ id: 2, name: 'b' }])
    })

    it('model used in computed', async () => {
      const runner = new Runner(mockBM.modelInComputed)
      const result = runner.init()

      await runner.ready()

      expect(result.userNames()).toEqual([])

      result.targetName(() => 'a')

      await runner.ready()

      expect(result.users()).toEqual([
        { id: 1, name: 'a' },
      ])
      expect(result.userNames()).toEqual(['a'])
    })
  
    describe('modify (default=server) ', () => {
      it('object:update property', async () => {
        const runner = new Runner(mockBM.userPessimisticModel)
        const result = runner.init()
        
        const newName = 'updated a'
  
        await runner.ready()

        result.users((draft: any) => {
          draft[0].name = newName
        })

        await runner.ready()

        const users = result.users()

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
  
        await runner.ready()

        result.users((draft: any) => {
          delete draft[1].name
        })
  
        await runner.ready()

        expect(result.users()).toEqual([
          { id: 1, name: 'a' },  
          { id: 2, name: null },  
        ])
      })
      it('array:create new element', async () => {
        const runner = new Runner(mockBM.userPessimisticModel)
        const result = runner.init()
          
        const newObj = { name: 'c', id: 3 }
  
        result.users((draft: any) => {
          draft.push(newObj)
        })
        await runner.ready()

        const users = result.users()
  
        expect(users).toEqual([
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
          newObj
        ])
      })
      it('array:remove element', async () => {
        const runner = new Runner(mockBM.userPessimisticModel)
        const result = runner.init()

        await runner.ready()

        result.users((draft: any) => {
          draft.splice(0, 1)
        })

        await runner.ready()
  
        expect(result.users()).toEqual([
          { id: 2, name: 'b' },  
        ])
      })
    })
  })
  describe('update model', () => {
    it('find immediate', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const cd: IHookContext['data'] = [
        ['data', { id: 1, name: 'a' }],
      ]
      const context = mockBM.initContext({
        data: cd
      })
      const result = runner.init([], context)
      
      await runner.ready()

      expect(result.users()).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ])
    })
  })
})