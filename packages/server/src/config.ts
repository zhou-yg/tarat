import * as path from 'path'
import * as fs from 'fs'
import l from 'lodash'
import { readViews } from './config/routes'
import { isFileEmpty, loadJSON, logFrame } from './util'
import chalk from 'chalk'
import { findDependencies } from './config/deps'
const { merge } = l

export const defaultConfig = () => ({
  // client about
  viewsDirectory: 'views', // in tarat the display unit maybe page or component, they should belong to "views"
  driversDirectory: 'drivers',
  composeDriversDirectory: 'compose',
  modelsDirectory: 'models',
  appDirectory: 'app',
  pageDirectory: 'pages',

  publicDirectory: 'public',

  entry: 'entry', // jsx|tsx|css|less|json

  entryServer: 'entry.server', // .(j|t)sx in app
  routesServer: 'routes.server', // serve for tarat self
  routes: 'routes', // serve for tarat self

  ts: false,

  devCacheDirectory: '.tarat', // in cwd
  buildDirectory: 'dist', // in cwd

  clientDir: 'client',
  serverDir: 'server',

  appClientChunk: 'chunks',

  cjsDirectory: 'cjs',
  esmDirectory: 'esm',

  modelEnhance: 'model.enhance.json',
  prismaModelPart: 'part.prisma', // postfix
  targetSchemaPrisma: 'schema.prisma',
  schemaIndexes: 'indexes',

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
  cjsDirectory: 'cjs',
  esmDirectory: 'esm',
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
  dir: string
}

export function readDrivers(dir: string) {
  if (!fs.existsSync(dir)) {
    return []
  }
  const drivers = fs.readdirSync(dir)

  const hookConfigs: IServerHookConfig[] = []
  // check drivers
  drivers.forEach(f => {
    const p = path.join(dir, f)
    if (fs.lstatSync(p).isDirectory()) {
      const children = readDrivers(p)
      hookConfigs.push(...children)
    }
  })
  
  const hookConfigs2 = drivers.filter(f => {
    const filePath = path.join(dir, f)
    return fs.lstatSync(filePath).isFile()
  }).map(f => {

    const filePath = path.join(dir, f)
    const name = f.replace(/\.\w+/, '')

    const code = fs.readFileSync(filePath).toString()
    const empty = isFileEmpty(code)
    if (!empty) {
      const exportDefaultNames = code.match(/export default (function [A-Za-z0-9_]+;?|[A-Za-z0-9_]+);?/)
      const exportDefaultAuto = code.match(/export { default }/)
      if (exportDefaultNames) {
        if (exportDefaultNames[1] !== name && exportDefaultNames[1] !== `function ${name}`) {
          logFrame(
            `The default export name mismatch file name
            export default name is ${chalk.red(exportDefaultNames[1])}
            file name is ${chalk.green(name)}`
          )
          throw new Error('[readDrivers] error 2')  
        }
      } else if (!exportDefaultAuto) {
  
        logFrame(`Must have a default export in ${filePath}`)
        throw new Error('[readDrivers] error 1')
      }
    }

    return {
      dir,
      filePath,
      file: f,
      name,
    }
  })

  hookConfigs.push(...hookConfigs2)

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
  const outputClientDir = path.join(outputDir, config.clientDir)
  const outputServerDir = path.join(outputDir, config.serverDir)

  const outputAppServerDir = path.join(outputServerDir, config.appDirectory)
  const outputAppClientDir = path.join(outputClientDir, config.appDirectory)


  return {
    outputDir, 
    outputClientDir,
    outputServerDir,
    // prisma
    outputModelsDir: path.join(outputDir, config.modelsDirectory),
    outputModelSchema: path.join(outputDir, config.modelsDirectory, config.targetSchemaPrisma),
    modelEnhanceFile: path.join(cwd, config.modelsDirectory, config.modelEnhance),
    modelTargetFile: path.join(cwd, config.modelsDirectory, config.targetSchemaPrisma),
    // views
    outputViewsDir: path.join(outputDir, config.viewsDirectory),
    outputDriversDir: path.join(outputDir, config.driversDirectory),

    /** server */

    // app
    outputAppServerDir,
    // router
    autoGenerateServerRoutes: path.join(outputAppServerDir, `${config.routesServer}${config.ts ? '.tsx' : '.jsx'}`),    
    distServerRoutes: path.join(outputAppServerDir, `${config.routesServer}.js`),
    distServerRoutesCSS: path.join(outputAppServerDir, `${config.routesServer}.css`),
    // entry
    distEntryJS: path.join(outputAppServerDir, `${config.entryServer}.js`),
    distEntryCSS: path.join(outputAppServerDir, `${config.entryServer}.css`),
    // drivers
    outputServerDriversDir: path.join(outputServerDir, config.driversDirectory),

    /** client */

    // app
    outputAppClientDir,
    // router
    autoGenerateClientRoutes: path.join(outputAppClientDir, `${config.routes}${config.ts ? '.tsx' : '.jsx'}`),
    clientRoutes: path.join(outputAppClientDir, 'routes.js'),
    clientRoutesCSS: path.join(outputAppClientDir, 'routes.css'),
    // drivers
    outputClientDriversDir: path.join(outputClientDir, config.driversDirectory),
  }
}

function readEntryCSS (pre: string, ) {
  const postfix = ['less', 'css']
  let r = ''
  postfix.forEach(p => {
    const f = `${pre}.${p}`
    if(fs.existsSync(f)) {
      if (r) {
        throw new Error(`[config.readEntryCSS] should not have duplcate style file from ${postfix}`)
      } else {
        r = f
      }
    }
  })
  return r
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

  const pacakgeJSON = loadJSON(path.join(cwd, 'package.json'))

  const viewsDirectory = path.join(cwd, config.viewsDirectory)
  const driversDirectory = path.join(cwd, config.driversDirectory)
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

  const drivers = readDrivers(driversDirectory).map(d => {
    return {
      ...d,
      relativeDir: path.relative(driversDirectory, d.dir)
    }
  })

  const entryCSS = readEntryCSS(path.join(cwd, config.appDirectory, config.entry))


  const devPointFiles = getOutputFiles(config, cwd, path.join(cwd, config.devCacheDirectory))
  const buildPointFiles = getOutputFiles(config, cwd, path.join(cwd, config.buildDirectory))
  // default to "dev"
  const pointFiles = isProd ? buildPointFiles : devPointFiles

  const dependencyModules = findDependencies(cwd)

  return {
    ...config,
    pacakgeJSON,
    isProd,
    entryCSS,
    pointFiles,
    devPointFiles,
    buildPointFiles,
    cwd,
    drivers,
    views,
    pages,
    dependencyModules,
  }
}
