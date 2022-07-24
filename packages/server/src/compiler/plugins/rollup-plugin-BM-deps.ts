import * as fs from 'fs'
import * as path from 'path'
import { Plugin } from 'vite'
import { IConfig } from '../../config'
import { loadJSON } from '../../util'

function checkHook (pre: string, id: string) {
  return /\.(j|t)s$/.test(id) && id.startsWith(pre)
}

function template (
  origin: string,
  deps: string,
  assigns: string
) {
  return `${origin}
const deps = ${deps}

${assigns}
`
}

export default function taratBMRollupPlugin (c: IConfig): Plugin {
  const cwd = c.cwd
  return {
    name: 'tarat-BM-deps',
    transform(code, id, options?) {
      const arr = [
        path.join(cwd, c.driversDirectory),
        /**
         * @TODO un support dependency module's hook compile
         */
        // ...c.dependencyModules.map(module => {
        //   return path.join(cwd, 'node_modules', module, c.driversDirectory)
        // })
      ]
      const isHook = arr.some(p => checkHook(p, id))
      if (isHook) {
        const parsed = path.parse(id)
        // in current project 
        const depsJSONPath = path.join(c.pointFiles.outputDriversDir, `${parsed.name}.deps.json`)
        // in node_modules unit

        if (fs.existsSync(depsJSONPath)) {
          const depsJSON = loadJSON(depsJSONPath)

          const arr = Object.keys(depsJSON).map(funcName => {
            return `Object.assign(${funcName}, { __deps__: deps.${funcName} })`
          })

          code = template(
            code,
            JSON.stringify(depsJSON),
            arr.join('\n')
          )
        }
      }

      return code
    },
    async resolveId (source: string, importer?: string, options?: any): Promise<any> {
      // if (source?.endsWith(taratRuntimeEntryFlag)) {
      //   return source
      // }
      // if (importer?.endsWith(taratRuntimeEntryFlag)) {
      //   return null
      // }
      // const resolution = await this.resolve(source, importer, { skipSelf: true, ...options });
      // if (!resolution || resolution.external) return resolution;

      // const isHook  = checkHook(cwd, c.driversDirectory, resolution.id)
        
      // if (isHook) {
      //   return `${resolution.id}${taratRuntimeEntryFlag}`        
      // }
    },
    load (id: string) {
      // if (id?.endsWith(taratRuntimeEntryFlag)) {
      //   const originalId = id.slice(0, -taratRuntimeEntryFlag.length)

      //   const parsed = path.parse(originalId)
      //   const depsJSONPath = path.join(c.pointFiles.outputDevDir, c.driversDirectory, `${parsed.name}.deps.json`)
        
      //   if (fs.existsSync(depsJSONPath)) {
      //     const depsJSON = loadJSON(depsJSONPath)
      //     let code = template(
      //       originalId,
      //       JSON.stringify(depsJSON),
      //     )
      //     return code
      //   } else {
      //     throw new Error(`[taratBMPlugin] "${parsed.name}" not found deps json by "${depsJSONPath}",
      //       please check the "tarat dev" output`)
      //   } 
      // }
    },
  }
}
