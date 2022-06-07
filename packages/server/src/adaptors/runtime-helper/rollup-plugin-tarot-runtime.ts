import { compile } from 'ejs'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const templateFile = './defaultRenderReact.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const template = compile(fs.readFileSync(templateFilePath).toString())

function isPage (cwd: string, viewsDirectory: string, id: string) {
  const id2 = id.replace(cwd, '')
  return /\.(j|t)sx$/.test(id2) && (new RegExp(`^\/${viewsDirectory}\/`)).test(id2)
}

const viewsDirectory = 'views'
const mountedAppId = 'app'

const tarotRuntimeEntryFlag = '?tarotRuntime'

export default function tarotRuntimeRollupPlugin (): any {
  const cwd = process.cwd()
  return {
    name: 'tarot-runtime',
    async resolveId (source: string, importer?: string, options?: any): Promise<any> {
      if (source?.endsWith(tarotRuntimeEntryFlag)) {
        return source
      }
      const resolution = await this.resolve(source, importer, { skipSelf: true, ...options });
      if (!resolution || resolution.external) return resolution;

      const page = isPage(cwd, viewsDirectory, resolution.id)
        
      if (page) {
        return `${resolution.id}${tarotRuntimeEntryFlag}`        
      }
    },
    load (id: string) {
      if (id?.endsWith(tarotRuntimeEntryFlag)) {
        const originalId = id.slice(0, -tarotRuntimeEntryFlag.length)

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
