import {
  IHookContext, Runner, getPlugin, IDiff, debuggerLog, startdReactiveChain,
  stopReactiveChain
} from 'tarat-core'
import { parseWithUndef } from 'tarat-connect'
import * as path from 'path'
import Application from 'koa'
import type { IConfig, IServerHookConfig } from '../config'
import { setCookies, setPrisma, setRunning, setER  } from '../plugins/'
import { buildDrivers } from '../compiler/prebuild'
import { loadJSON } from '../util'

function matchHookName (path: string) {
  const arr = path.split('/').filter(Boolean)
  return {
    pre: arr[0],
    driverName: arr[1]
  }
}

export function wrapCtx (ctx: any) {
  return {
    cookies: {
      set (name: any, value: any) {
        return ctx.cookies.set(name, value)
      },
      get (name: any) {
        console.log('[wrapCtx] get name: ', name);
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
    const { pre, driverName } = matchHookName(ctx.request.path)
    if (pre === apiPre && ctx.request.method === 'POST') {      
      const hookConfig = drivers.find(h => h.name === driverName)
      if (hookConfig) {

        const driver = config.drivers.find(d => d.name === driverName)

        // driver has double nested output structure
        const BMPath = path.join(pointFiles.outputDriversDir, config.cjsDirectory, driver.relativeDir, `${driverName}.js`)
        const BM = require(BMPath)

        const c: IHookContext = parseWithUndef(ctx.request.body)

        let runner = new Runner(BM.default)
        
        const scope = runner.prepareScope(c.initialArgList, c)
        getPlugin('GlobalRunning').setCurrent(scope, wrapCtx(ctx))

        console.log('==== before exeexecuteDriver ===============')

        const chain1 = startdReactiveChain(`${driverName}(init)`)

        runner.executeDriver(scope)

        getPlugin('GlobalRunning').setCurrent(scope, null)

        await runner.ready()

        chain1.stop()
        chain1.print()

        // debuggerLog(true)

        const chain2 = startdReactiveChain(`${driverName}:call(${c.index})`)

        if (c.index !== undefined) {
          await runner.scope.callHook(c.index, c.args)
        }

        await runner.ready()

        chain2.stop()
        chain2.print()

        const context = runner.scope.createPatchContext()
        
        ctx.body = JSON.stringify(context);

        (runner as any) = null

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
