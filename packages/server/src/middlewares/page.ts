import Application from "koa";
import { IConfig, IViewConfig } from "../config";
import { compile } from 'ejs'
import * as fs from 'fs'
import * as path from 'path'
import { ViteDevServer } from "vite";
import { fileURLToPath } from 'url'
import { debuggerLog, getPlugin, IHookContext, Runner, startdReactiveChain, stopReactiveChain } from "tarat-core";
import { wrapCtx } from "./taratRunner";
import { buildEntryServer, buildRoutes } from "../compiler/build";
import { renderToString } from 'react-dom/server'
import { RenderDriver, renderWithDriverContext, DriverContext } from 'tarat-connect'
import React, { createElement } from "react";

const templateFile = './pageTemplate.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const template = compile(fs.readFileSync(templateFilePath).toString())

async function renderPage (ctx: Application.ParameterizedContext, config: IConfig) {

  const { distRoutesFile, distEntryJS, distEntryCSS, distRoutesFileCSS } = config.pointFiles

  let entryFunctionModule = (doc: React.ReactElement) => doc
  if (fs.existsSync(distEntryJS)) {
    entryFunctionModule = require(distEntryJS)
  }
  const routesEntryModule = require(distRoutesFile)

  const driver = new RenderDriver()
  driver.mode = 'collect'

  let cancelGlobalRunning = () => {}

  driver.onPush(runner => {
    getPlugin('GlobalRunning').setCurrent(runner.scope, wrapCtx(ctx))
    cancelGlobalRunning = () => {
      getPlugin('GlobalRunning').setCurrent(runner.scope, null) 
    }
  })

  const appEntry = renderWithDriverContext(
    entryFunctionModule(
      routesEntryModule({
        location: ctx.request.path
      })
    ),
    driver,
  )
  // console.log('entryFunctionModule.default: ', viewConfig.name, entryFunctionModule.default.toString());

  // const html = renderToString(entryFunctionModule.default(viewConfig.name))
  const html = renderToString(appEntry.root)

  appEntry.cancelAdaptor()
  driver.pushListener = undefined
  cancelGlobalRunning()

  const allRunedHook = []
  for (const BMArr of driver.BMValuesMap.values()) {
    allRunedHook.push(...BMArr)
  }
  await Promise.all(allRunedHook.map((runner: Runner<any>) => runner.ready()))

  driver.mode = 'consume'
  const appEntryUpdate = renderWithDriverContext(
    entryFunctionModule(
      routesEntryModule({
        location: ctx.request.path
      })
    ),
    driver,
  )
  const html2 = renderToString(appEntryUpdate.root)

  // console.log('entryFunctionModule.default: ', viewConfig.name, entryFunctionModule.default.toString());
  // const html = renderToString(entryFunctionModule.default(viewConfig.name))

  // console.log('driver: ', driver);
  // console.log('html: ', html);
  // console.log('html2: ', html2);

  const entryServerCss = fs.existsSync(distEntryCSS) ? fs.readFileSync(distEntryCSS).toString() : ''
  const css = fs.existsSync(distRoutesFileCSS) ? fs.readFileSync(distRoutesFileCSS).toString() : ''

  return {
    driver,
    html,
    html2,
    css: css + entryServerCss,
  }
}

/**
 * @TODO should provide by default
 */
 export default function page (args: {
   config: IConfig
   pages: IViewConfig[]
   vite: ViteDevServer
}) : Application.Middleware {

  const config = args.config

  return async (ctx, next) => {
    const pathname = ctx.request.path
    const viewConfig = args.pages.find(v => v.path === pathname || v.path === path.join(pathname, 'index'))
    if (viewConfig) {
      let context: { [k: string]: IHookContext[] } = {}
      let ssrHTML = ''

      const r = await renderPage(ctx, args.config)
      if (r) {
        for (const v of r.driver.BMValuesMap) {
          context[v[0]] = v[1].map((runner: Runner<any>) => runner.scope.createInputComputeContext())
        }
        ssrHTML = r.html2
      }

      const { autoGenerateRoutesClientFile } = config.pointFiles

      let html = template({
        hookContextMap: JSON.stringify(context),
        src: autoGenerateRoutesClientFile,
        css: r?.css,
        ssrHTML,
        configJSON: JSON.stringify({
          apiPre: args.config.apiPre,
          diffPath: args.config.diffPath,
        })
      })
      html = await args.vite.transformIndexHtml(pathname, html)

      ctx.body = html

    } else {
      await next()
    }
  }
}