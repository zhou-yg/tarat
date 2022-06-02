import Application from "koa";
import koaBody from 'koa-body'
import cors from '@koa/cors'
import Koa from 'koa'
import e2k from 'express-to-koa'

import tarotRunner from "./middlewares/tarotRunner";
import view from "./middlewares/view";

import { createServer } from "vite";
import { IConfig } from "./config";

export function setupBasicServer (app: Application) {

  app.use(async (ctx, next) => {
    await next()
  })
  app.use(koaBody())
  app.use(cors())

  return app
}

export async function createDevServer (c: IConfig) {
  const app = new Koa()
  setupBasicServer(app)

  app.use(tarotRunner({
    apiPre: c.apiPre,
    hooks: c.hooks
  }))

  const vite = await createServer({
    root: process.cwd(),
    server:{ middlewareMode: 'ssr' },
    resolve: {
      alias: {
        '@tarot-run/core': '@tarot-run/core/dist/index.client.js'
      }
    }
  })

  app.use(e2k(vite.middlewares))
  
  app.use(view({
    config: c,
    views: c.views,
    vite,
  }))

  app.listen(c.port)

  console.log(`start listen on:${c.port}`)
}
