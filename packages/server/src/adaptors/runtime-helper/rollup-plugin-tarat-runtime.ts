import { compile } from 'ejs'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { IConfig } from '../../config'

const templateFile = './defaultRenderReact.ejs'
const templateFilePath = path.join(__dirname, templateFile)
const template = compile(fs.readFileSync(templateFilePath).toString())

const templateFile2 = './defaultRenderReact.ejs'
const templateFilePath2 = path.join(__dirname, templateFile2)
const routesTemplate = compile(fs.readFileSync(templateFilePath2).toString())



function isPage (cwd: string, pagesDirectory: string, id: string) {
  const id2 = id.replace(cwd, '')
  return /\.(j|t)sx$/.test(id2) && (new RegExp(`^\/${pagesDirectory}\/`)).test(id2)
}

const pagesDirectory = 'app/pages'
const mountedAppId = 'app'

const taratRuntimeEntryFlag = '?taratRuntime'
const noRouterEntryFlag = '?noRouter'

export default function taratRuntimeRollupPlugin (c: IConfig): any {
  const cwd = process.cwd()
  return {
    name: 'tarat-runtime',
    async resolveId (source: string, importer?: string, options?: any): Promise<any> {
      console.log('source: ', source);
      if (source?.endsWith(taratRuntimeEntryFlag) || source?.endsWith(noRouterEntryFlag)) {
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

        const autoGenerateRoutesClientFile = path.join(c.cwd, c.appDirectory, `${c.routes}${c.ext}`)
        const routesEntry = fs.readFileSync(autoGenerateRoutesClientFile).toString()

        const viewCode = routesEntry // fs.readFileSync(originalId).toString()
        const exportDefaultName = viewCode.match(/export default ([A-Za-z0-9_]+);?/)
        
        if (exportDefaultName) {
          let code = routesTemplate({
            viewCode: routesEntry,
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
