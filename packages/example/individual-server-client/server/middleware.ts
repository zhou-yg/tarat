import { Runner } from '@tarot-run/core'
import Application from 'koa'
import hook from './hook.js'

export default function tarotMiddleware () : Application.Middleware{
  return async (ctx, next) => {
    if (/hook/.test(ctx.request.path)) {
      const runner = new Runner(hook)
      runner.init()
      console.log(ctx.request.body)
    } else {
      await next()
    }  
  } 
}