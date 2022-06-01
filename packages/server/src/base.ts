import Application from "koa";
import koaBody from 'koa-body'
import cors from '@koa/cors'
import tarotRunner from "./middlewares/tarotRunner";

export default function (app: Application) {

  app.use(koaBody())
  app.use(cors())
  app.use(tarotRunner())

  return app
}
