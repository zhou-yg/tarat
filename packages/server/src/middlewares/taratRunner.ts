import {
  IHookContext, Runner, getPlugin, IDiff, debuggerLog, startdReactiveChain,
  stopReactiveChain
} from 'tarat-core'
import { parseWithUndef, stringifyWithUndef } from 'tarat-connect'
import { join } from 'path'
import Application from 'koa'
import type { IConfig, IServerHookConfig } from '../config'
import { setCookies, setPrisma, setRunning, setER  } from '../plugins/'
import { buildDrivers } from '../compiler/prebuild'
import { loadJSON } from '../util'
import { filterFileType } from './unserialize'

function matchHookName (p: string) {
  const arr = p.split('/').filter(Boolean)
  return {
    pre: arr[0],
    driverName: arr[1]
  }
}

export function wrapCtx (ctx: any) {
  return {
    cookies: {
      set (name: any, value: any) {
        console.log('[wrapCtx.cookies] name, value: ', name, value);
        return ctx.cookies.set(name, value)
      },
      get (name: any) {
        console.log('[wrapCtx.cookies] get name: ', name);
        const val = ctx.cookies.get(name)
        return val
      }
    }
  }
}

/**
 * @TODO should provide by @tarat-run by default
 */
export default function taratMiddleware (args: {
  config: IConfig
}) : Application.Middleware{
  const { config } = args
  const { drivers, apiPre, diffPath, cwd, model, pointFiles } = config

  setRunning()
  setCookies()
  if (model?.engine === 'prisma') {
    setPrisma(config)
  } else if (model?.engine === 'er') {
    setER()
  }

  return async (ctx, next) => {
    const { path, body } = ctx.request
    const { pre, driverName } = matchHookName(path)
    if (pre === apiPre && ctx.request.method === 'POST') {      
      const hookConfig = drivers.find(h => h.name === driverName)
      if (hookConfig) {

        const driver = config.drivers.find(d => d.name === driverName)

        // driver has double nested output structure
        const BMPath = join(pointFiles.outputDriversDir, config.cjsDirectory, driver.relativeDir, `${driverName}.js`)
        const BM = require(BMPath)

        const c: IHookContext = typeof body === 'string' ? parseWithUndef(body) : body;

        let runner = new Runner(BM.default)
        
        let scope = runner.prepareScope(c.initialArgList, c)
        getPlugin('GlobalRunning').setCurrent(scope, wrapCtx(ctx))

        console.log('==== before exeexecuteDriver ===============')

        const chain1 = startdReactiveChain(`${driverName}(init)`)

        runner.executeDriver(scope)

        await scope.ready()

        chain1.stop()
        chain1.print()

        // debuggerLog(true)

        const chain2 = startdReactiveChain(`${driverName}:call(${c.index})`)

        if (c.index !== undefined) {
          await scope.callHook(c.index, c.args)
        }

        await scope.ready()

        getPlugin('GlobalRunning').setCurrent(scope, null)

        chain2.stop()
        chain2.print()

        const context = scope.createPatchContext()
        const contextWithoutFile = filterFileType(context)
        ctx.body = stringifyWithUndef(contextWithoutFile);

        (runner as any) = null;
        (scope as any) = null;

        console.log(`[${driverName}] is end \n ---`)
      } else {
        await next()        
      }
    } else if (pre === diffPath && ctx.request.method === 'POST') {
      const c: { entity: string, diff: IDiff } = JSON.parse(ctx.request.body)
      await getPlugin('Model').executeDiff('@unknownExecuteDiff', c.entity, c.diff)
      ctx.body = JSON.stringify({})
    } else {
      await next()
    }  
  } 
}
