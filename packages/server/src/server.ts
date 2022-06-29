import Application from "koa";
import koaBody from 'koa-body'
import cors from '@koa/cors'
import Koa from 'koa'
import e2k from 'express-to-koa'

import taratRunner from "./middlewares/taratRunner";
import view from "./middlewares/view";

import { createServer } from "vite";
import { IConfig } from "./config";

import rollupPlugintaratRuntime from './adaptors/runtime-helper/rollup-plugin-tarat-runtime'

export function setupBasicServer (app: Application) {

  app.use(async (ctx, next) => {
    await next()
  })
  app.use(koaBody())
  app.use(cors())

  return app
}

export async function createDevServer (c: IConfig) {
  console.log('c: ', c);
  
  const app = new Koa()
  setupBasicServer(app)

  app.use(taratRunner({
    config: c
  }))

  const vite = await createServer({
    root: process.cwd(),
    server:{ middlewareMode: 'ssr' },
    plugins: [
      {
        ...rollupPlugintaratRuntime(),
        enforce: 'pre',
      } 
    ],
    resolve: {
      alias: {
        'tarat-core': 'tarat-core/dist/index.client.js'
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

  const defaultView = c.views[0]?.name || ''

  console.log(`start listen on http://localhost:${c.port}/${defaultView}`)
}
