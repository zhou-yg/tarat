import client from '@prisma/client'

if (!client.PrismaClient) {
  throw new Error('[setPrisma] error, prisma.PrismaClient not found please run prisma generate first')
}

const prisma = new client.PrismaClient()
prisma.$connect()

export async function clearAll () {
  prisma.item.deleteMany({})
}

export default prisma
