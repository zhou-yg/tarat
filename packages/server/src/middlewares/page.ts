import Application from "koa";
import { IConfig, IViewConfig } from "../config";
import { compile } from 'ejs'
import * as fs from 'fs'
import * as path from 'path'
import { ViteDevServer } from "vite";
import { fileURLToPath } from 'url'
import { CurrentRunnerScope, debuggerLog, getPlugin, IHookContext, Runner, startdReactiveChain, stopReactiveChain } from "tarat/core";
import { wrapCtx } from "./runner";
import { renderToString } from 'react-dom/server'
import { RenderDriver, renderWithDriverContext, DriverContext } from 'tarat/connect'
import React, { createElement } from "react";
import { matchRoute } from "../config/routes";
import chalk from 'chalk'

const templateFile = './pageTemplate.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const template = compile(fs.readFileSync(templateFilePath).toString())

function transformIndexHtml (html: string, c: IConfig) {
  return html.replace(
    new RegExp(`${c.pointFiles.outputDir}`, 'g'),
    ''
  )
}

async function renderPage (ctx: Application.ParameterizedContext, config: IConfig) {

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

  const routerLocation = ctx.request.path + ctx.request.search

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
    // css: css + entryServerCss,
    css,
  }
}

/**
 * @TODO should provide by default
 */
 export default function page (args: {
   config: IConfig
   pages: IViewConfig[]
   vite?: ViteDevServer
}) : Application.Middleware {

  const config = args.config

  return async (ctx, next) => {
    const pathname = ctx.request.path
    const viewConfig = matchRoute(args.pages, pathname)
    if (viewConfig) {
      let context: Record<string, IHookContext[]> = {}
      let ssrHTML = ''

      console.log('>> start render page path=', pathname)

      const r = await renderPage(ctx, args.config)
      if (r) {
        for (const v of r.driver.BMValuesMap) {
          context[v[0]] = v[1].map((scope: CurrentRunnerScope<any>) => scope.createBaseContext())
        }
        ssrHTML = r.html2
      }

      const { autoGenerateClientRoutes, clientRoutes } = config.pointFiles

      const src = config.isProd ? clientRoutes : autoGenerateClientRoutes

      let html = template({
        title: viewConfig.name,
        hookContextMap: JSON.stringify(context),
        src,
        css: r?.css,
        ssrHTML,
        configJSON: JSON.stringify({
          apiPre: args.config.apiPre,
          diffPath: args.config.diffPath,
        })
      })

      // use on dev
      if (args.vite && !config.isProd) {
        html = await args.vite.transformIndexHtml(pathname, html)
      } else {
        html = transformIndexHtml(html, config)
      }

      ctx.body = html

    } else {
      await next()
    }
  }
}
