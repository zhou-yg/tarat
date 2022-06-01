import Application from "koa";
import koaBody from 'koa-body'
import cors from '@koa/cors'

export function setupBasicServer (app: Application) {

  app.use(koaBody())
  app.use(cors())

  return app
}
