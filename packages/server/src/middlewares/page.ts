import Application from "koa";
import { IConfig, IViewConfig } from "../config";
import { compile } from 'ejs'
import * as fs from 'fs'
import * as path from 'path'
import { ViteDevServer } from "vite";
import { fileURLToPath } from 'url'
import { debuggerLog, getPlugin, IHookContext, Runner, startdReactiveChain, stopReactiveChain } from "tarat-core";
import { wrapCtx } from "./taratRunner";
import { buildEntryServer } from "../compiler/build";
import { renderToString } from 'react-dom/server'
import { RenderDriver, renderWithDriverContext, DriverContext } from 'tarat-connect'
import React, { createElement } from "react";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const templateFile = './viewTemplate.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const template = compile(fs.readFileSync(templateFilePath).toString())


async function renderPage (ctx: Application.ParameterizedContext, config: IConfig, viewConfig: IViewConfig) {
  const r = await buildEntryServer(config)
  // const r = {
  //   entry: '/Users/yunge/Documents/tarat/packages/example/user-login-system/.tarat/entry.server.js',
  // }


  if (r?.entry) {
    const entryFunctionModule = await import(r.entry)
    
    const driver = new RenderDriver()

    let cancelGlobalRunning = () => {}

    driver.onPush(runner => {
      getPlugin('GlobalRunning').setCurrent(runner.scope, wrapCtx(ctx))
      cancelGlobalRunning = () => {
        getPlugin('GlobalRunning').setCurrent(runner.scope, null) 
      }
    })

    const appEntry = renderWithDriverContext(
      entryFunctionModule.default(viewConfig.name, DriverContext),
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

    console.log('driver: ', driver);
    console.log('html: ', html);

    return {
      driver,
      html,
    }
  }
}

/**
 * @TODO should provide by default
 */
 export default function view (args: {
   config: IConfig
   pages: IViewConfig[]
   vite: ViteDevServer
}) : Application.Middleware {
  return async (ctx, next) => {
    const path = ctx.request.path
    const viewConfig = args.pages.find(v => v.path === path)

    if (viewConfig) {
      let context: { [k: string]: IHookContext[] } = {}
      let ssrHTML = ''
      const hookName = ctx.request.query.hook

      const r = await renderPage(ctx, args.config, viewConfig)
      if (r) {
        for (const v of r.driver.BMValuesMap) {
          context[v[0]] = v[1].map((runner: Runner<any>) => runner.scope.createInputComputeContext())
        }
        ssrHTML = r.html
      }

      let html = template({
        hookContextMap: JSON.stringify(context),
        src: viewConfig.file,
        ssrHTML,
        configJSON: JSON.stringify({
          apiPre: args.config.apiPre,
          diffPath: args.config.diffPath,
        })
      })
      html = await args.vite.transformIndexHtml(path, html)

      ctx.body = html

    } else {
      await next()
    }
  }
}