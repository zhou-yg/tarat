import Koa from 'koa'
import { Runner } from '@tarot-run/core'
import hook from './hook.js'

const app = new Koa()

app.use(async (ctx, next) => {
  if (/hook/.test(ctx.request.path)) {
    const runner = new Runner(hook)
    runner.init()
  } else {
    await next()
  }
})

app.use(async (ctx) => {
  ctx.body = 'hello'
})
app.listen(9001)
console.log('listen on http://localhost:9001')

export default app