import { Runner, cloneDeep, debuggerLog, IDiff, IHookContext, IQueryWhere, set, setEnv, startdReactiveChain, stopReactiveChain, State, Model, Computed } from '../../src/index'

import * as mockBM from '../mockBM'
import prisma, { clearAll } from '../prisma'

describe('writeModel', () => {
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
    await prisma.sub_package_Item.deleteMany({})
    // check delete result
    const r = await prisma.item.findMany({})
    if (r.length > 0) {
      await prisma.item.deleteMany({})
      await prisma.sub_package_Item.deleteMany({})

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
      await prisma.sub_package_Item.create({
        data: { ...data, name: `sub-${data.name}` }
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
  
  it('inject write model', async () => {
    const runner = new Runner(mockBM.writeWritePrisma)
    const result = runner.init()
    
    await runner.scope.ready()
    expect(result.itemsLength()).toBe(2)

    await result.ic()

    expect(result.itemsLength()).toBe(3)
    expect(result.p1()).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 10, name: 'aa'}
    ])
  })
})