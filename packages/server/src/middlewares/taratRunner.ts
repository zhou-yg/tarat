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
    setPrisma(cwd)
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
        getPlugin('GlobalRunning').setCurrent(runner.scope, wrapCtx(ctx))

        console.log('=================================================')

        const chain1 = startdReactiveChain(`${driverName}(init)`)

        runner.init(c.initialArgList, c)

        stopReactiveChain()

        getPlugin('GlobalRunning').setCurrent(runner.scope, null)

        await runner.ready()
        chain1.print()

        // debuggerLog(true)

        const chain2 = startdReactiveChain(`${driverName}:call(${c.index})`)

        if (c.index !== undefined) {
          await runner.callHook(c.index, c.args)
        }

        await runner.ready()

        stopReactiveChain()

        chain2.print()

        const context = runner.scope.createInputComputeContext()

        
        ctx.body = JSON.stringify(context);

        (runner as any) = null

        console.log(`[${driverName}] is end`)
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
