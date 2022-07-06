import { loadPlugin } from 'tarat-core'
import { join } from 'path'
export async function setPrisma (cwd: string)  {
  // @ts-ignore
  const client: any = (await import(join(cwd, 'node_modules/@prisma/client/index.js')))
  if (!client.PrismaClient) {
    throw new Error('[setPrisma] error, prisma.PrismaClient not found please run prisma generate first')
  }
  const prisma = new client.PrismaClient()
  prisma.$connect()

  loadPlugin('Model', {
    async find(e, w) {
      return prisma[e].findMany(w)
    },
    async update(e, w) {
      return prisma[e].update(w)
    },
    async remove(e, d) {
      return prisma[e].delete(d)
    },
    async create(e, q) {
      return prisma[e].create(q)
    },
    // should check relation here
    async executeDiff(e, d) {
      await Promise.all(d.create.map(async obj => {
        await prisma[e].create({
          data: obj.value
        })
      }))
      await Promise.all(d.update.map(async obj => {
        const { source } = obj
        if (source.id === undefined || source.id === null) {
          throw new Error('[update] must with a id')
        }
        await prisma[e].update({
          where: {
            id: source.id
          },
          data: obj.value
        })
      }))
      await Promise.all(d.remove.map(async obj => {
        const { source, value } = obj
        if (value.id === undefined || value.id === null) {
          throw new Error('[remove] must with a id')
        }
        await prisma[e].delete({
          where: {
            id: value.id
          },
        })
      }))
    },
  })
}
