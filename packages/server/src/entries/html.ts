import * as fs from 'fs'
import { IConfig } from "../config"
import { RenderDriver, renderWithDriverContext, } from 'tarat/connect'
import { CurrentRunnerScope, debuggerLog, getPlugin, startdReactiveChain } from "tarat/core";
import { renderToString } from 'react-dom/server'
import chalk from 'chalk'

export interface PageContext {
  cookies: {
    get: any;
    set: any;
  }
  location: string
}
export function wrapCtx (ctx: PageContext) {
  return {
    cookies: {
      set (name: any, value: any) {
        // console.log('[wrapCtx.cookies] name, value: ', name, value);
        return ctx.cookies.set(name, value)
      },
      get (name: any) {
        // console.log('[wrapCtx.cookies] get name: ', name);
        const val = ctx.cookies.get(name)
        return val
      }
    }
  }
}

export async function renderPage (ctx: PageContext, config: IConfig) {

  const { distServerRoutes, distEntryJS, distEntryCSS, distServerRoutesCSS } = config.pointFiles

  let entryFunctionModule = (doc: React.ReactElement) => doc
  if (fs.existsSync(distEntryJS)) {
    entryFunctionModule = require(distEntryJS).default
  }
  const routesEntryModule = require(distServerRoutes).default

  const driver = new RenderDriver()
  driver.mode = 'collect'

  let cancelGlobalRunning = () => {}

  console.log('[before driver.onPush] : ');

  driver.onPush(scope => {

    getPlugin('GlobalRunning').setCurrent(scope, wrapCtx(ctx))
    cancelGlobalRunning = () => {
      getPlugin('GlobalRunning').setCurrent(scope, null) 
    }
  })

  const routerLocation = ctx.location

  const chain = startdReactiveChain('[renderWithDriverContext first]')
  const appEntry = renderWithDriverContext(
    entryFunctionModule(
      routesEntryModule({
        location: routerLocation
      })
    ),
    driver,
  )

  debuggerLog(true)

  console.log('[before renderToString] first ');
  const html = renderToString(appEntry.root)

  appEntry.cancelAdaptor()
  driver.pushListener = undefined
  cancelGlobalRunning()

  let allRunedHook: CurrentRunnerScope<any>[] = []
  for (const BMArr of driver.BMValuesMap.values()) {
    allRunedHook = allRunedHook.concat(BMArr)
  }
  await Promise.all(allRunedHook.map((scope) => {
    return scope.ready()
  }))
  chain.stop()
  chain.print()

  console.log('---- await first done ----')

  const st = Date.now()

  driver.switchToServerConsumeMode()

  const chain2 = startdReactiveChain('[renderWithDriverContext second]')

  const appEntryUpdate = renderWithDriverContext(
    entryFunctionModule(
      routesEntryModule({
        location: routerLocation
      })
    ),
    driver,
  )

  const html2 = renderToString(appEntryUpdate.root)

  chain2.stop()
  chain2.print()

  const cost = Date.now() - st

  const css = []
  fs.existsSync(distEntryCSS) && css.push(distEntryCSS)
  fs.existsSync(distServerRoutesCSS) && css.push(distServerRoutesCSS)

  console.log(`[${routerLocation}] is end. second rendering cost ${chalk.blue(cost)} ms \n ---`)

  return {
    driver,
    html,
    html2,
    css,
  }
}
