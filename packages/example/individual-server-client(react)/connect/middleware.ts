import { IHookContext, Runner } from 'tarat-core'
import Application from 'koa'
import hook from '../hooks/hook.js'

/**
 * @TODO should provide by @tarot-run by default
 */
export default function tarotMiddleware () : Application.Middleware{
  return async (ctx, next) => {
    if (/_hook/.test(ctx.request.path) && ctx.request.method === 'POST') {
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
