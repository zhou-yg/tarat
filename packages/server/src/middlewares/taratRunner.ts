import {
  IHookContext, Runner, getPlugin, IDiff, debuggerLog, startdReactiveChain,
  stopReactiveChain
} from 'tarat-core'
import { parseWithUndef } from 'tarat-connect'
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
      set (name: any, value: any) {
        console.log('[Cookies] set(name, value): ', name, value);
        return ctx.cookies.set(name, value)
      },
      get (name: any) {
        const val = ctx.cookies.get(name)
        console.log('[Cookies] get(name, value): ', name, val);
        return val
      }
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
        const c: IHookContext = parseWithUndef(ctx.request.body)

        let runner = new Runner(hookFunc.default)
        getPlugin('GlobalRunning').setCurrent(runner.scope, wrapCtx(ctx))
        console.log('ctx cookie: ', ctx.cookies.get('userDataKey'));

        const chain1 = startdReactiveChain()

        runner.init(c.initialArgList, c)

        stopReactiveChain()
        chain1.print()

        getPlugin('GlobalRunning').setCurrent(runner.scope, null)

        await runner.ready()

        // debuggerLog(true)

        const chain2 = startdReactiveChain()

        if (c.index !== undefined) {
          await runner.callHook(c.index, c.args)
        }

        stopReactiveChain()

        await runner.ready()

        chain2.print()

        const context = runner.scope.createInputComputeContext()

        
        ctx.body = JSON.stringify(context);

        (runner as any) = null

        console.log(`[${hookName}] is end`)
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
