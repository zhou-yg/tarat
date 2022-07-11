import Application from "koa";
import { IConfig } from "../config";
export default function pureDevCache (args: {
  config: IConfig
}) : Application.Middleware {

 const config = args.config

 return async (ctx, next) => {
  for (const k in require.cache) {
    if (
      k.startsWith(config.pointFiles.distEntryJS) ||
      k.startsWith(config.pointFiles.distRoutesFile)
    ) {
      delete require.cache[k]
    }
  }

  await next()
 }
}