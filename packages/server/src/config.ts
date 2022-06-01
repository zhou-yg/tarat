import * as path from 'path'
import * as fs from 'fs'

const defaultConfig = () => ({
  // client about
  viewsDirectory: 'views', // in tarot the display unit maybe page or component, they should belong to "views"
  hooksDirectory: 'hooks',

  apiPre: '/_hook'
})

export interface IConfig extends IDefaultConfig{
  
}

const configFile = 'tarot.config.js'


async function readPages (dir: string) {
  console.log('not read pages now')
} 

export interface IServerHookConfig {
  filePath: string
  file: string
  name: string
  hookFunc: (...args: any[]) => any
}

async function readHooks(dir: string) {
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
      name: f.replace(/\.(t|j)s/, ''),
      hookFunc: require(filePath)
    }
  })

  return hookConfigs
}

type UnPromisify<T> = T extends Promise<infer R> ? R : T;

type IDefaultConfig = UnPromisify<ReturnType<typeof readConfig>>

export interface IConfig extends IDefaultConfig{
  
}


export async function readConfig (arg: {
  cwd: string
}) {
  const { cwd } = arg
  const configFileInPath = path.join(cwd, configFile)

  let config = defaultConfig()
  if (fs.existsSync(configFileInPath)) {
    const configInFile = require(configFileInPath)
    Object.assign(config, configInFile)
  }

  const viewsDirectory = path.join(cwd, config.viewsDirectory)
  const hooksDirectory = path.join(cwd, config.hooksDirectory)

  await readPages(viewsDirectory)

  const hooks = await readHooks(hooksDirectory)

  return {
    apiPre: config.apiPre,
    hooks
  }
}
