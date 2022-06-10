import * as path from 'path'
import * as fs from 'fs'
import l from 'lodash'
const { merge } = l
export const defaultConfig = () => ({
  // client about
  viewsDirectory: 'views', // in tarat the display unit maybe page or component, they should belong to "views"
  hooksDirectory: 'hooks',
  
  // server side
  apiPre: '_hook',

  diffPath: '_diff',

  port: 9100,
  model: {
    engine: 'prisma'
  }
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
  parentId?: string
  /**
   * The path this route uses to match on the URL pathname.
   */
  path: string
  /**
   * single file name with file extension
   */
  name: string

  index?: boolean
  // file absolute path in system
  file: string
}

const isIndexFlagn = (f: string) => /^index.(j|t)sx$/.test(f) || /\/index.(j|t)sx$/.test(f)

function defineView (viewDir: string, file: string, name: string, parent?: IViewConfig): IViewConfig[] {
  const configs: IViewConfig[] = []
  const currentFileOrDirPath = path.join(viewDir, file)
  const current: IViewConfig = {
    id: file,
    parentId: parent?.id,
    path: file.replace(/\.\w+/, ''),
    file,
    name,
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

  const viewConfigs = views.map(f => {
    const file = path.join(dir, f)
    return defineView(viewDir, file, f, parent)
  })

  return viewConfigs.flat()
} 

export interface IServerHookConfig {
  filePath: string
  file: string
  name: string
  hookFunc: Promise<{ default: (...args: any[]) => any }>
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
      hookFunc: import(filePath)
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

  const views = readViews(viewsDirectory, '/')
  views.forEach(c => {
    c.file = path.join('./', config.viewsDirectory, c.file)
  })

  const hooks = readHooks(hooksDirectory)

  return {
    ...config,
    cwd,
    hooks,
    views,
  }
}
