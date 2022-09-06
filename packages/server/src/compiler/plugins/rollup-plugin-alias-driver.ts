import * as fs from 'fs'
import * as path from 'path'
import { Plugin } from 'vite'
import { IConfig } from '../../config'
import { loadJSON } from '../../util'

function checkHook (pre: string, id: string) {
  return /\.(j|t)s$/.test(id) && id.startsWith(pre)
}

export default function taratBMRollupPlugin (c: IConfig): Plugin {
  const cwd = c.cwd
  return {
    name: 'tarat-alias-driver',
    async resolveId (source: string, importer?: string, options?: any): Promise<any> {
      console.log('source: ', source);
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
