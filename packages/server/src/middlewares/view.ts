import Application from "koa";
import { IConfig, IViewConfig } from "../config";
import { compile } from 'ejs'
import * as fs from 'fs'
import * as path from 'path'
import { ViteDevServer } from "vite";
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const templateFile = './viewTemplate.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const template = compile(fs.readFileSync(templateFilePath).toString())
/**
 * @TODO should provide by @tarot-run by default
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

      let html = template({
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