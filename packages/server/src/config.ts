import * as path from 'path'
import * as fs from 'fs'
import l from 'lodash'
import { readViews } from './config/routes'
import { logFrame } from './util'
import chalk from 'chalk'
const { merge } = l

export const defaultConfig = () => ({
  // client about
  viewsDirectory: 'views', // in tarat the display unit maybe page or component, they should belong to "views"
  hooksDirectory: 'hooks',
  modelsDirectory: 'models',
  appDirectory: 'app',
  pageDirectory: 'pages',

  publicDirectory: 'public',

  entryServer: 'entry.server', // .(j|t)sx in app
  routesServer: 'routes.server', // serve for tarat self
  routes: 'routes', // serve for tarat self

  ts: false,

  devCacheDirectory: '.tarat', // in cwd
  buildDirectory: 'dist', // in cwd
  appServer: 'server',
  appClient: 'client',
  appClientChunk: 'chunks',


  modelEnhance: 'model.enhance.json',
  prismaModelPart: 'part.prisma', // postfix
  targetSchemaPrisma: 'schema.prisma',

  // server side
  apiPre: '_hook',

  diffPath: '_diff',

  port: 9100,
  model: {
    engine: 'prisma'
  },

  // compose
  compose: []
})

export type IDefaultConfig = ReturnType<typeof defaultConfig> & {
  model?: {
    engine: 'prisma' | 'er'
  }
}


const configFile = 'tarat.config.js'

export interface IViewConfig {
  /**
   * The unique id for this route, named like its `file` but without the
   * extension. So `app/routes/gists/$username.jsx` will have an `id` of
   * `routes/gists/$username`.
   */
  id: string
  parentId: string
  /**
   * The path this route uses to match on the URL pathname.
   */
  path: string
  /**
   * single file name without file extension
   */
  name: string

  index?: boolean
  // file absolute path relative to current project
  file: string

  dir: boolean

  dynamic: boolean
}

function readPages (viewDir: string, dir: string) {
  const pages = readViews(viewDir, dir)

  return pages
}

export interface IServerHookConfig {
  filePath: string
  file: string
  name: string
  // hookFunc: Promise<{ default: (...args: any[]) => any }>
}

export function readHooks(dir: string) {
  const hooks = fs.readdirSync(dir)
  // check hooks
  hooks.forEach(f => {
    if (fs.lstatSync(path.join(dir, f)).isDirectory()) {
      throw new Error('dont set directory in hooks')
    }
  })
  
  const hookConfigs: IServerHookConfig[] = hooks.map(f => {

    const filePath = path.join(dir, f)
    const name = f.replace(/\.\w+/, '')

    const code = fs.readFileSync(filePath).toString()
    const exportDefaultNames = code.match(/export default (function [A-Za-z0-9_]+;?|[A-Za-z0-9_]+);?/)
    if (exportDefaultNames) {
      if (exportDefaultNames[1] !== name && exportDefaultNames[1] !== `function ${name}`) {
        logFrame(
          `The default export must equal to it's file name.
          export default name is ${chalk.red(exportDefaultNames[1])}
          file name is ${chalk.green(name)}`
        )
        throw new Error('[readHooks] error 2')  
      }
    } else {
      logFrame(`Must have a default export in ${filePath}`)
      throw new Error('[readHooks] error 1')
    }

    return {
      filePath,
      file: f,
      name,
    }
  })

  return hookConfigs
}

type UnPromisify<T> = T extends Promise<infer R> ? R : T;

type IReadConfigResult = UnPromisify<ReturnType<typeof readConfig>>

export interface IConfig extends IReadConfigResult{
  model: {
    engine: 'prisma' | 'er'
  }
}

function getOutputFiles (config: IDefaultConfig, cwd:string, outputDir: string) {

  const outputAppDir = path.join(outputDir, config.appDirectory)

  const outputAppServerDir = path.join(outputAppDir, config.appServer)
  const outputAppClientDir = path.join(outputAppDir, config.appClient)

  return {
    outputDir, // includings 3 types: normal, app/server, app/client
    /** normal */
    // place compiled hooks/views "cjs" file
    outputHooksDir: path.join(outputDir, config.hooksDirectory),
    outputViewsDir: path.join(outputDir, config.viewsDirectory),
    // place compiled hooks "esm" file
    outputHooksESMDir: path.join(outputDir, config.hooksDirectory, 'esm'),
    // prisma
    outputModelsDir: path.join(outputDir, config.modelsDirectory),
    outputModelSchema: path.join(outputDir, config.modelsDirectory, config.targetSchemaPrisma),
    modelEnhanceFile: path.join(cwd, config.modelsDirectory, config.modelEnhance),
    modelTargetFile: path.join(cwd, config.modelsDirectory, config.targetSchemaPrisma),
    
    outputAppDir,
    outputAppServerDir,
    outputAppClientDir,
    /** app/server */
    // router
    autoGenerateServerRoutes: path.join(outputAppServerDir, `${config.routesServer}${config.ts ? '.tsx' : '.jsx'}`),    
    distServerRoutes: path.join(outputAppServerDir, `${config.routesServer}.js`),
    distServerRoutesCSS: path.join(outputAppServerDir, `${config.routesServer}.css`),
    // entry
    distEntryJS: path.join(outputAppServerDir, `${config.entryServer}.js`),
    distEntryCSS: path.join(outputAppServerDir, `${config.entryServer}.css`),
    serverEntyTSX: path.join(outputAppServerDir, `${config.entryServer}.tsx`),
    serverEntyJSX: path.join(outputAppServerDir, `${config.entryServer}.jsx`),


    /** app/client */
    // client side route doesnt need compiled, it will be auto compiled in vite
    autoGenerateClientRoutes: path.join(outputAppClientDir, `${config.routes}${config.ts ? '.tsx' : '.jsx'}`),
    clientRoutes: path.join(outputAppClientDir, 'index.js'),
    clientRoutesCSS: path.join(outputAppClientDir, 'index.css'),
    clientChunksDir: path.join(outputAppClientDir, config.appClientChunk, `${config.routes}${config.ts ? '.tsx' : '.jsx'}`),
  }
}

export async function readConfig (arg: {
  cwd: string,
  isProd?: boolean
}) {
  const { cwd, isProd } = arg
  const configFileInPath = path.join(cwd, configFile)

  let config = defaultConfig() as IDefaultConfig
  if (fs.existsSync(configFileInPath)) {
    const configInFile = require(configFileInPath)
    merge(config, configInFile)
  }

  const viewsDirectory = path.join(cwd, config.viewsDirectory)
  const hooksDirectory = path.join(cwd, config.hooksDirectory)
  const appDirectory = path.join(cwd, config.appDirectory)
  const pagesDirectory = path.join(appDirectory, config.pageDirectory)

  const views = readViews(viewsDirectory, '/')
  views.forEach(c => {
    c.file = path.join('./', config.viewsDirectory, c.file)
  })

  const pages = readPages(pagesDirectory, '/')
  pages.forEach(c => {
    c.file = path.join('./', config.appDirectory, config.pageDirectory, c.file)
  })

  const hooks = readHooks(hooksDirectory)

  const devPointFiles = getOutputFiles(config, cwd, path.join(cwd, config.devCacheDirectory))
  const buildPointFiles = getOutputFiles(config, cwd, path.join(cwd, config.buildDirectory))
  // default to "dev"
  const pointFiles = isProd ? buildPointFiles : devPointFiles

  return {
    ...config,
    isProd,
    pointFiles,
    devPointFiles,
    buildPointFiles,
    cwd,
    hooks,
    views,
    pages,
  }
}
