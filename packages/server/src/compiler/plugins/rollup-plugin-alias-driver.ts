import * as fs from 'fs'
import * as path from 'path'
import { Plugin } from 'vite'
import { IConfig } from '../../config'
import { loadJSON } from '../../util'

function isDriver (path: string, tag: string) {
  const pathArr = path.split('/')
  
  return pathArr.includes(tag)
}

export default function aliasDriverRollupPlugin (c: IConfig, env: 'server' | 'client'): Plugin {
  const {
    cwd,
    esmDirectory,
    driversDirectory
  } = c
  const {
    outputClientDir,
    outputServerDir
  } = c.pointFiles

  const envDriverOutputDir = env === 'server' ? outputServerDir : outputClientDir

  const defaultFormat = esmDirectory

  return {
    name: 'tarat-alias-driver',
    async resolveId (source: string, importer: string, options) {

      if (!importer) {
        return null
      }
      if (isDriver(source, driversDirectory)) {
        const resolution = await this.resolve(source, importer, { skipSelf: true, ...options })
        if (!resolution || resolution.external) {
          return resolution
        }
        const aliasSource = resolution.id
          .replace(cwd, envDriverOutputDir)
          .replace(new RegExp(`\\/${driversDirectory}\\/`), `/${driversDirectory}/${defaultFormat}/`)
          .replace(/\.ts$/, '.js')
        
        const r2 = await this.resolve(aliasSource, importer, { skipSelf: true, ...options })
        console.log('r2: ', r2);
        return r2
      }
    },
  }
}
