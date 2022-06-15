import { IHookContext, Runner, getPlugin, IDiff } from 'tarat-core'
import Application from 'koa'
import type { IConfig, IServerHookConfig } from '../config'
import { setCookies, setPrisma, setRunning, setER  } from '../plugins/'

function matchHookName (path: string) {
  const arr = path.split('/').filter(Boolean)
  return {
    pre: arr[0],
    hookName: arr[1]
  }
}

function wrapCtx (ctx: Application.ParameterizedContext) {
  return {
    cookies: {
      set: ctx.cookies.set.bind(ctx.cookies),
      get: ctx.cookies.get.bind(ctx.cookies)
    }
  }
}

/**
 * @TODO should provide by @tarat-run by default
 */
export default function taratMiddleware (args: {
  config: Pick<IConfig, 'hooks' | 'apiPre' | 'diffPath' | 'cwd'> & { model?: IConfig['model'] }
}) : Application.Middleware{
  const { hooks, apiPre, diffPath, cwd, model } = args.config

  setRunning()
  setCookies()
  if (model?.engine === 'prisma') {
    setPrisma(cwd)
  } else if (model?.engine === 'er') {
    setER()
  }

  return async (ctx, next) => {
    const { pre, hookName } = matchHookName(ctx.request.path)
    if (pre === apiPre && ctx.request.method === 'POST') {      
      const hookConfig = hooks.find(h => h.name === hookName)
      if (hookConfig) {        
        const hookFunc = await hookConfig.hookFunc
        const c: IHookContext = JSON.parse(ctx.request.body)

        getPlugin('GlobalRunning').setCurrent(wrapCtx(ctx))

        let runner = new Runner(hookFunc.default, c)
        runner.init(...c.initialArgList)

        getPlugin('GlobalRunning').setCurrent(null)
        
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
      await getPlugin('Model').executeDiff(c.entity, c.diff)
      ctx.body = JSON.stringify({})
    } else {
      await next()
    }  
  } 
}
