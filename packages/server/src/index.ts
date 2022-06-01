import { IConfig } from "./config";
import Koa from 'koa'
import { setupBasicServer } from './basicServer'
import tarotRunner from "./middlewares/tarotRunner";

export function createDevServer (c: IConfig) {
  const app = new Koa()

  setupBasicServer(app)

  app.use(tarotRunner({
    apiPre: c.apiPre,
    hooks: c.hooks
  }))
}
