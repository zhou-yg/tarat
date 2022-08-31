import Application from "koa";
import koaBody from 'koa-body'
import cors from '@koa/cors'
import Koa from 'koa'
import staticServe from 'koa-static'
import e2k from 'express-to-koa'
import chalk from 'chalk'
import taratRunner from "./middlewares/taratRunner";
import page from "./middlewares/page";

import { createServer as createViteServer } from "vite";
import tsconfigPaths from 'vite-tsconfig-paths'

import { IConfig } from "./config";
import getPort, { makeRange as portNumbers } from "get-port";

import pureDevCache from "./middlewares/pureDevCache";
import { getAddress, getDefeaultRoute, logFrame } from "./util";
import path, { join } from "path";

export function setupBasicServer (c: IConfig) {
  const app = new Koa()
  app.use(koaBody({
    multipart: true
  }))
  app.use(cors())
  app.use(staticServe(c.publicDirectory))
  app.use(async (ctx, next) => {
    await next()
  })

  return app
}

async function startApp(app: Application, c: IConfig) {

  const port = await getPort({
    port: c.port ? c.port : process.env.PORT ? Number(process.env.PORT) : portNumbers(9000, 9100)
  })

  app.listen(port)

  const defaultView = getDefeaultRoute(c.pages)


  let address = getAddress()
  
  if (address) {
    address = `ip: ${chalk.green(`http://${address}:${port}/${defaultView}`)}`
  }
  logFrame(`
    Tarat App Server started at:
      localhost: ${chalk.green(`http://localhost:${port}/${defaultView}`)}
      ${address || ''}
  `)
}

export async function createDevServer (c: IConfig) {  
  const app = setupBasicServer(c)

  app.use(pureDevCache({
    config: c
  }))

  app.use(taratRunner({
    config: c
  }))

  const vite = await createViteServer({
    root: c.cwd,
    server:{ middlewareMode: 'ssr' },
    plugins: [
      tsconfigPaths(),
      // {
      //   ...rollupPlugintaratRuntime(c),
      //   enforce: 'pre',
      // }      
      // {
      //   ...rollupPluginBMDeps(c),
      //   enforce: 'pre'
      // }
    ],
    resolve: {
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: [
        {
          find: 'tarat-core',
          replacement: 'tarat-core/dist/index.client.js',
        },
        {
          find: /^drivers\/(\w+)\.\w+$/,
          replacement: join(c.devCacheDirectory, c.driversDirectory, c.esmDirectory, '$1.js'),
        }
      ]
    }
  })

  app.use(e2k(vite.middlewares))


  app.use(page({
    config: c,
    pages: c.pages,
    vite,
  }))

  startApp(app, c)
}


export async function createServer(c: IConfig) {
  const app = setupBasicServer(c)
 
  app.use(staticServe(c.buildDirectory))

  app.use(taratRunner({
    config: c
  }))

  app.use(page({
    config: c,
    pages: c.pages,
  })) 

  startApp(app, c)
}