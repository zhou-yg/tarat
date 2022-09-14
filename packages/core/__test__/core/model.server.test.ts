import { Runner, cloneDeep, debuggerLog, IDiff, IHookContext, IQueryWhere, set, setEnv, startdReactiveChain, stopReactiveChain, State, Model, Computed } from '../../src/index'

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
      async find (from: string, e: 'item', w: IQueryWhere) {
        return prisma[e].findMany(w as any)
      },
      async create (from: string, e: 'item', w: IQueryWhere) {
        return prisma[e].create(w as any)
      },
      async update (from: string, e: 'item', w: IQueryWhere) {
        return prisma[e].update(w as any)
      },
      async remove (from: string, e: 'item', w: IQueryWhere) {
        return prisma[e].delete(w as any)
      },
      async executeDiff (from: string, entity: 'item', diff: IDiff) {
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
      
      expect(runner.state()).toBe('pending')

      await runner.ready()

      expect(runner.state()).toBe('idle')

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

    it('model used in computed (with chain) ', async () => {
      const runner = new Runner(mockBM.modelInComputed)

      const initChain = startdReactiveChain()

      const result = runner.init()

      expect(runner.state()).toBe('idle')

      expect(result.usersProgress().state).toBe('init')

      stopReactiveChain()

      // @TODO
      // const firstComputed = initChain.children[0]
      // expect(firstComputed.hook).toBeInstanceOf(Computed)
      // expect(firstComputed.children[0].hook).toBeInstanceOf(Model)
      // expect(firstComputed.children[0].type).toBe('call')
      // expect(firstComputed.children[0].children[0].hook).toBeInstanceOf(Computed)
      // expect(firstComputed.children[0].children[0].children[0].hook).toBeInstanceOf(State)
      // expect(firstComputed.children[0].children[0].children[0].type).toBe('call')
      // expect(firstComputed.children[0].children[0].children[1].hook).toBeInstanceOf(Model)


      expect(result.userNames()).toEqual([])

      const chain = startdReactiveChain()

      result.targetName(() => 'a')

      stopReactiveChain()
      
      await runner.ready()

      expect(chain.children[0].oldValue).toBe('')
      expect(chain.children[0].newValue).toBe('a')
      expect(chain.children[0].hook).toBeInstanceOf(State)
      expect(chain.children[0].children[0].hook).toBeInstanceOf(Computed)
      expect(chain.children[0].children[0].children[0].hook).toBeInstanceOf(State)
      expect(chain.children[0].children[0].children[1].hook).toBeInstanceOf(Model)
      expect(chain.children[0].children[0].children[1].children[0].hook).toBeInstanceOf(Computed)

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

    describe('with writeModel', () => {

      it('connectModel', async () => {
        const runner = new Runner(mockBM.writeModelWithSource)
        const result = runner.init()

        await runner.ready()

        result.name(() => 'c')
        await result.createItem('')

        await runner.scope.ready()

        expect(result.items()[2].name).toEqual('c')

        await result.createItem('ddd')
        await runner.scope.ready()

        expect(result.items()[3].name).toEqual('ddd')
      })
    })
  })
  describe('update model', () => {
    it('find immediate', async () => {
      const runner = new Runner(mockBM.userPessimisticModel)
      const cd: IHookContext['data'] = [
        ['data', { id: 1, name: 'a' }, Date.now()],
      ]
      const context = mockBM.initContext({
        index: undefined,
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

  describe('dependent models', () => {
    it('apply compute patches sequence', async () => {
      const runner = new Runner(mockBM.multiPatchesInputCompute)
      const result = runner.init()
      
      await runner.scope.ready()

      expect(result.item()).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ])

      await result.ic()
  
      expect(result.item()).toEqual([
        { id: 1, name: 'updated' },
        { id: 2, name: 'b' },
        { id: 3, name: '1'}
      ])
    })  
  })
})