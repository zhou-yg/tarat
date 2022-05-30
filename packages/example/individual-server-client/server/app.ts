import Koa from 'koa'

const app = new Koa()
app.use(async (ctx) => {
  ctx.body = 'hello'
})
app.listen(9001)
console.log('listen on http://localhost:9001')