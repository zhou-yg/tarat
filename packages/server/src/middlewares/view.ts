import Application from "koa";
import { IConfig, IViewConfig } from "../config";
import { compile } from 'ejs'
import * as fs from 'fs'
import * as path from 'path'
import { ViteDevServer } from "vite";
import { fileURLToPath } from 'url'
import { getPlugin, IHookContext, Runner, startdReactiveChain, stopReactiveChain } from "tarat-core";
import { wrapCtx } from "./taratRunner";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const templateFile = './viewTemplate.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const template = compile(fs.readFileSync(templateFilePath).toString())
/**
 * @TODO should provide by default
 */
 export default function view (args: {
   config: IConfig
   views: IViewConfig[]
   vite: ViteDevServer
}) : Application.Middleware {
  return async (ctx, next) => {
    const path = ctx.request.path
    const viewConfig = args.views.find(v => v.path === path)

    if (viewConfig) {

      const hookName = ctx.request.query.hook

      const loginHook = args.config.hooks.find(c => c.name === hookName)

      let context: { [k: string]: IHookContext } = {}
      if (loginHook) {
        const hookFunc = await loginHook.hookFunc
        const runner = new Runner(hookFunc.default)
        getPlugin('GlobalRunning').setCurrent(runner.scope, wrapCtx(ctx))

        const chain = startdReactiveChain()
        runner.init()
        stopReactiveChain()

        getPlugin('GlobalRunning').setCurrent(runner.scope, null)

        await runner.ready()
        chain.print()
        Object.assign(context, {
          [hookFunc.default.name]: runner.scope.createInputComputeContext()
        })
      }

      let html = template({
        hookContextMap: JSON.stringify(context),
        src: viewConfig.file,
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