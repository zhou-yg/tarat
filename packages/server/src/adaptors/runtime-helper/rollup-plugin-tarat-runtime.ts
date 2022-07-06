import { compile } from 'ejs'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const templateFile = './defaultRenderReact.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const template = compile(fs.readFileSync(templateFilePath).toString())

function isPage (cwd: string, pagesDirectory: string, id: string) {
  const id2 = id.replace(cwd, '')
  return /\.(j|t)sx$/.test(id2) && (new RegExp(`^\/${pagesDirectory}\/`)).test(id2)
}

const pagesDirectory = 'app/pages'
const mountedAppId = 'app'

const taratRuntimeEntryFlag = '?taratRuntime'

export default function taratRuntimeRollupPlugin (): any {
  const cwd = process.cwd()
  return {
    name: 'tarat-runtime',
    async resolveId (source: string, importer?: string, options?: any): Promise<any> {
      if (source?.endsWith(taratRuntimeEntryFlag)) {
        return source
      }
      const resolution = await this.resolve(source, importer, { skipSelf: true, ...options });
      if (!resolution || resolution.external) return resolution;

      const page = isPage(cwd, pagesDirectory, resolution.id)
        
      if (page) {
        return `${resolution.id}${taratRuntimeEntryFlag}`        
      }
    },
    load (id: string) {
      if (id?.endsWith(taratRuntimeEntryFlag)) {
        const originalId = id.slice(0, -taratRuntimeEntryFlag.length)

        const viewCode = fs.readFileSync(originalId).toString()
        const exportDefaultName = viewCode.match(/export default ([\w\W]+);?/)
        
        if (exportDefaultName) {
          let code = template({
            viewCode,
            exportDefaultName: exportDefaultName[1],
            mountedAppId
          })
          return code
        } else {
          throw new Error('the file in pages must have a default Export')
        }
      }
    },
  }
}
