import { cloneDeep, debuggerLog, IDiff, IHookContext, IQueryWhere, set, setEnv } from '../../src/index'
import {
  Runner,
} from '../../src'

import * as mockBM from '../mockBM'
import prisma, { clearAll } from '../prisma'

describe('update model', () => {
  beforeAll(() => {
    // make sure the model run in server envirnment
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
  afterAll(() => {
    process.env.TARGET = ''
  })

  it('find immediate', async () => {
    const runner = new Runner(mockBM.userPessimisticModel)
    const cd: IHookContext['data'] = [
      ['data', { id: 1, name: 'a' }],
    ]
    const context = mockBM.initContext({
      data: cd
    })
    const result = runner.init([], context)
    
    expect(await result.users()).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ])
  })
})