import { IHookContext, Runner } from '@tarot-run/core'
import Application from 'koa'
import type { IServerHookConfig } from '../config'

function matchHookName (path: string) {
  const arr = path.split('/').filter(Boolean)
  return {
    pre: arr[0],
    hookName: arr[1]
  }
}

/**
 * @TODO should provide by @tarot-run by default
 */
export default function tarotMiddleware (args: {
  apiPre: string
  hooks: IServerHookConfig[]
}) : Application.Middleware{

  return async (ctx, next) => {
    const { pre, hookName } = matchHookName(ctx.request.path)
    if (pre === args.apiPre && ctx.request.method === 'POST') {      
      const hookConfig = args.hooks.find(h => h.name === hookName)
      if (hookConfig) {        
        const hookFunc = await hookConfig.hookFunc
        const c: IHookContext = JSON.parse(ctx.request.body)
        let runner = new Runner(hookFunc.default, c)
        runner.init(...c.initialArgList)
  
        if (c.index) {
          await runner.callHook(c.index, c.args)
        }
        const context = runner.scope.createInputComputeContext()
  
        ctx.body = JSON.stringify(context);

        (runner as any) = null
      } else {
        await next()        
      }
    } else {
      await next()
    }  
  } 
}
