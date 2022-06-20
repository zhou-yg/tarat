import { Runner, cloneDeep, IDiff, IHookContext, IQueryWhere, set, setEnv, debuggerLog } from '../../../src/index'
import prisma, { clearAll } from '../../prisma'
import * as mockBM from '../../mockBM'

export default () => {

  describe('client model', () => {
    beforeAll(() => {
      // make sure the model run in server envirnment
      process.env.TARGET = 'server'
      clearAll()
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
      let times = 0;

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
        },
        async postQueryToServer(c: IHookContext): Promise<IHookContext> {
          process.env.TARGET = 'server'

          times++
          if (times > 3) {
            throw new Error('max call')
          }

          const runner = new Runner(mockBM[c.name as keyof typeof mockBM])
          runner.init(c.initialArgList as any, c)
          if (c.index !== undefined) {
            await runner.callHook(c.index, c.args)
          }
          await runner.ready()

          await mockBM.wait(100)
          const context = runner.scope.createInputComputeContext()

          process.env.TARGET = ''
          debuggerLog(false)

          return context
        }
      })
    })
    afterAll(() => {
      process.env.TARGET = ''
    })
    describe('mount model', () => {
    
      it('post query to server', async () => {
        const runner = new Runner(mockBM.userModelClient)
        const result = runner.init()
    
        expect(await result.users()).toEqual([
          { id: 1, name: 'a' },
        ])
      })
    })
    describe('update model', () => {
      it('query immediate with context', async () => {
        const runner = new Runner(mockBM.userModelClient)
        const cd: IHookContext['data'] = [
          ['data', 3],
          ['data', [{ id: 3, name: 'c' }]]
        ]
        const context = mockBM.initContext({
          data: cd
        })
        // debuggerLog(true)
        const result = runner.init([], context)
    
        expect(await result.users()).toEqual([
          { id: 3, name: 'c' },
        ])
      })
    })
  })
}