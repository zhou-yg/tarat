import { IHookContext, Runner } from '@tarot-run/core'
import Application from 'koa'
import hook from '../server/hook.js'

export default function tarotMiddleware () : Application.Middleware{
  return async (ctx, next) => {
    if (/hook/.test(ctx.request.path) && ctx.request.method === 'POST') {
      const c: IHookContext = JSON.parse(ctx.request.body)
      const runner = new Runner(hook, c)
      runner.init(...c.initialArgList)

      if (c.index) {
        await runner.callHook(c.index, c.args)
      }
      const context = runner.scope.createInputComputeContext()

      ctx.body = JSON.stringify(context)
    } else {
      await next()
    }  
  } 
}
