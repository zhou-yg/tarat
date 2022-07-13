import Application from "koa";
import koaBody from 'koa-body'
import os from "os";
import cors from '@koa/cors'
import Koa from 'koa'
import e2k from 'express-to-koa'
import chalk from 'chalk'
import taratRunner from "./middlewares/taratRunner";
import page from "./middlewares/page";

import { createServer } from "vite";
import { IConfig } from "./config";
import getPort, { makeRange as portNumbers } from "get-port";

import rollupPluginBMDeps from './compiler/plugins/rollup-plugin-BM-deps'
import pureDevCache from "./middlewares/pureDevCache";
import { getDefeaultRoute, logFrame } from "./util";

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

    
  app.use(pureDevCache({
    config: c
  }))

  app.use(taratRunner({
    config: c
  }))

  const vite = await createServer({
    root: process.cwd(),
    server:{ middlewareMode: 'ssr' },
    plugins: [
      // {
      //   ...rollupPlugintaratRuntime(c),
      //   enforce: 'pre',
      // }      
      {
        ...rollupPluginBMDeps(c),
        enforce: 'pre'
      }
    ],
    resolve: {
      alias: {
        'tarat-core': 'tarat-core/dist/index.client.js'
      }
    }
  })

  app.use(e2k(vite.middlewares))


  app.use(page({
    config: c,
    pages: c.pages,
    vite,
  }))

  const port = await getPort({
    port: c.port ? c.port : process.env.PORT ? Number(process.env.PORT) : portNumbers(9000, 9100)
  })

  app.listen(port)

  const defaultView = getDefeaultRoute(c.pages)


  let address =
  process.env.HOST ||
  Object.values(os.networkInterfaces())
    .flat()
    .find((ip) => ip?.family === "IPv4" && !ip.internal)?.address;

  
  if (address) {
    address = `ip: ${chalk.green(`http://${address}:${port}/${defaultView}`)}`
  }
  logFrame(`
    Tarat App Server started at:
      localhost: ${chalk.green(`http://localhost:${port}/${defaultView}`)}
      ${address || ''}
  `)

  return app
}
