import { IHookContext, Runner, setModelConfig } from '@tarot-run/core'

export async function setPrisma ()  {
  const client: any = (await import('@prisma/client'))
  if (!client.PrismaClient) {
    throw new Error('[setPrisma] error, prisma.PrismaClient not found please run prisma generate first')
  }
  const prisma = new client.PrismaClient()
  prisma.$connect()

  setModelConfig({
    async find(e, w) {
      return []
    },
    async update(e, w) {
      return []
    },
    async remove(e, d) {
      return []
    },
    async create(e, d) {
      return {}
    },
    async executeDiff(e, d) {},
    async postDiffToServer(e, d) {},
    async postComputeToServer(c) {
      return {
        name: '',
        initialArgList: [],
        args: [],
        data: []
      }
    },
  })
}
