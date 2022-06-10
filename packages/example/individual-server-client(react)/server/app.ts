import Koa from 'koa'
import taratMiddleware from '../connect/middleware.js'
import koaBody from 'koa-body'
import cors from '@koa/cors'

const app = new Koa()

app.use(koaBody())
app.use(cors())
app.use(taratMiddleware())

app.use(async (ctx) => {
  ctx.body = 'hello'
})
app.listen(9001)
console.log('listen on http://localhost:9001')

export default app