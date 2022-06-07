import { compile } from 'ejs'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const templateFile = './defaultRenderReact.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const template = compile(fs.readFileSync(templateFilePath).toString())

function isPage (cwd, pagesDirectory, id) {
  const id2 = id.replace(cwd, '')
  return /\.(j|t)sx$/.test(id2) && (new RegExp(`^\/${pagesDirectory}\/`)).test(id2)
}

const pagesDirectory = 'pages'
const mountedAppId = 'app'

const tarotRuntimeEntryFlag = '?tarotRuntime'

export default function tarotRuntimeRollupPlugin () {
  const cwd = process.cwd()
  return {
    name: 'tarot-runtime',
    async resolveId (source, importer, options) {
      console.log('[resolveId] source, importer: ', source, importer);
      if (!importer) {
        const resolution = await this.resolve(source, importer, { skipSelf: true, ...options });
        const page = isPage(cwd, pagesDirectory, resolution.id)
  
        const moduleInfo = await this.load(resolution);
        moduleInfo.moduleSideEffects = true;

        if (page || 1) {
          return `${resolution.id}${tarotRuntimeEntryFlag}`        
        }
      }
    },
    load (id) {
      if (id?.endsWith(tarotRuntimeEntryFlag)) {
        const originalId = id.slice(0, -tarotRuntimeEntryFlag.length)
        const { hasDefaultExport } = this.getModuleInfo(originalId);

        if (hasDefaultExport) {
          let code = template({
            resolutionId: originalId,
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
