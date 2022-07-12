import * as path from 'path'
import * as fs from 'fs'
import l from 'lodash'
const { merge } = l

export const defaultConfig = () => ({
  // client about
  viewsDirectory: 'views', // in tarat the display unit maybe page or component, they should belong to "views"
  hooksDirectory: 'hooks',
  modelsDirectory: 'models',
  appDirectory: 'app',
  pageDirectory: 'pages',

  entryServer: 'entry.server', // .(j|t)sx in app
  routesServer: 'routes.server', // serve for tarat self
  routes: 'routes', // serve for tarat self

  ts: false,

  devCacheDirectory: '.tarat', // in cwd

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
  // file absolute path in system
  file: string
}

const isIndexFlagn = (f: string) => /^index.(j|t)sx$/.test(f) || /\/index.(j|t)sx$/.test(f)

const isPageFile = (f: string) => /\.(j|t)sx$/.test(f)

function defineView (viewDir: string, file: string, name: string, parent?: IViewConfig): IViewConfig[] {

  const configs: IViewConfig[] = []
  const currentFileOrDirPath = path.join(viewDir, file)
  const current: IViewConfig = {
    id: file,
    parentId: parent?.id || '',
    path: file.replace(/\.\w+/, ''),
    file,
    name: name.replace(/\.\w+/, ''),
    index: isIndexFlagn(file)
  }
  if (fs.lstatSync(currentFileOrDirPath).isDirectory()) {
    const childConfigs = readViews(viewDir, file, current)
    configs.push(...childConfigs)
  } else {
    configs.push(current)
  }

  return configs
}

function readViews (viewDir: string, dir: string, parent?: IViewConfig) {
  const views = fs.readdirSync(path.join(viewDir, dir))

  const viewConfigs = views.filter(f => {
    const file = path.join(viewDir, dir, f)

    return isPageFile(file) || fs.lstatSync(file).isDirectory()
  }).map(f => {
    const file = path.join(dir, f)
    return defineView(viewDir, file, f, parent)
  })

  return viewConfigs.flat()
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
  
  // @TODO add compiler here 
  const hookConfigs: IServerHookConfig[] = hooks.map(f => {

    const filePath = path.join(dir, f)
    return {
      filePath,
      file: f,
      name: f.replace(/\.\w+/, ''),
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

export async function readConfig (arg: {
  cwd: string
}) {
  const { cwd } = arg
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

  const outputDevDir = path.join(cwd, config.devCacheDirectory)
  
  const pointFiles = {
    outputDevDir,

    // place compiled hooks "cjs" file
    devHooksDir: path.join(outputDevDir, config.hooksDirectory),
    // place compiled hooks "esm" file
    devHooksESMDir: path.join(outputDevDir, config.hooksDirectory, 'esm'),
    // routes
    autoGenerateRoutesFile: path.join(outputDevDir, `${config.routesServer}${config.ts ? '.tsx' : '.jsx'}`),    
    distRoutesFile: path.join(outputDevDir, `${config.routesServer}.js`),
    distRoutesFileCSS: path.join(outputDevDir, `${config.routesServer}.css`),
    /**
     * client side route doesnt need compiled, it will be auto compiled in vite
     */
    autoGenerateRoutesClientFile: path.join(outputDevDir, `${config.routes}${config.ts ? '.tsx' : '.jsx'}`),

    // entry
    distEntryJS: path.join(outputDevDir, `${config.entryServer}.js`),
    distEntryCSS: path.join(outputDevDir, `${config.entryServer}.css`),
    serverEntyTSX: path.join(cwd, config.appDirectory, `${config.entryServer}.tsx`),
    serverEntyJSX: path.join(cwd, config.appDirectory, `${config.entryServer}.jsx`),

    // prisma
    modelEnhanceFile: path.join(cwd, config.modelsDirectory, `${config.modelEnhance}`),
    modelTargetFile: path.join(cwd, config.modelsDirectory, `${config.targetSchemaPrisma}`),
  }

  return {
    ...config,
    pointFiles,
    cwd,
    hooks,
    views,
    pages,
  }
}
