import Koa from 'koa'
import tarotMiddleware from './middleware'
import koaBody from 'koa-body'

const app = new Koa()

app.use(koaBody())
app.use(tarotMiddleware())

app.use(async (ctx) => {
  ctx.body = 'hello'
})
app.listen(9001)
console.log('listen on http://localhost:9001')

export default app