/**
 * a middleware mode for existed Koa Server
 */
import taratRunner from "./middlewares/taratRunner";
import { defaultConfig, IDefaultConfig, readHooks } from "./config";

// type IMiddleConfig = {
//   hooksDirectory: string,
//   apiPre?: string,
//   diffPath?: string,
//   model: {
//     engine: 'prisma' | 'er'
//   }
// }

// export function middlewares (c: IMiddleConfig) {

//   const hooks = readHooks(c.hooksDirectory)

//   const mergedConfig = Object.assign(defaultConfig(), c)

//   return taratRunner({
//     config: {
//       hooks,
//       apiPre: mergedConfig.apiPre,
//       diffPath: mergedConfig.diffPath,
//       cwd: process.cwd(),
//       model: c.model
//     }
//   })
// }
