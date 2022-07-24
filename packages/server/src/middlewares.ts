/**
 * a middleware mode for existed Koa Server
 */
import taratRunner from "./middlewares/taratRunner";
import { defaultConfig, IDefaultConfig, readDrivers } from "./config";

// type IMiddleConfig = {
//   driversDirectory: string,
//   apiPre?: string,
//   diffPath?: string,
//   model: {
//     engine: 'prisma' | 'er'
//   }
// }

// export function middlewares (c: IMiddleConfig) {

//   const drivers = readDrivers(c.driversDirectory)

//   const mergedConfig = Object.assign(defaultConfig(), c)

//   return taratRunner({
//     config: {
//       drivers,
//       apiPre: mergedConfig.apiPre,
//       diffPath: mergedConfig.diffPath,
//       cwd: process.cwd(),
//       model: c.model
//     }
//   })
// }
