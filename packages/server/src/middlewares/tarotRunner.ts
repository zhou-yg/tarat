import { IHookContext, Runner, getModelConfig, IDiff } from '@tarot-run/core'
import Application from 'koa'
import type { IConfig, IServerHookConfig } from '../config'
import { setPrisma } from '../adaptors/prisma'

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
  config: Pick<IConfig, 'hooks' | 'apiPre' | 'diffPath' | 'cwd'> & { model?: IConfig['model'] }
}) : Application.Middleware{
  const { hooks, apiPre, diffPath, cwd, model } = args.config

  if (model?.engine === 'prisma') {
    setPrisma(cwd)
  }

  return async (ctx, next) => {
    const { pre, hookName } = matchHookName(ctx.request.path)
    if (pre === apiPre && ctx.request.method === 'POST') {      
      const hookConfig = hooks.find(h => h.name === hookName)
      if (hookConfig) {        
        const hookFunc = await hookConfig.hookFunc
        const c: IHookContext = JSON.parse(ctx.request.body)
        let runner = new Runner(hookFunc.default, c)
        runner.init(...c.initialArgList)
  
        if (c.index !== undefined) {
          await runner.callHook(c.index, c.args)
        }
        const context = runner.scope.createInputComputeContext()
  
        ctx.body = JSON.stringify(context);

        (runner as any) = null
      } else {
        await next()        
      }
    } else if (pre === diffPath && ctx.request.method === 'POST') {
      const c: { entity: string, diff: IDiff } = JSON.parse(ctx.request.body)
      await getModelConfig().executeDiff(c.entity, c.diff)
      ctx.body = JSON.stringify({})
    } else {
      await next()
    }  
  } 
}
