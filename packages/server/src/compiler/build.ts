import * as fs from 'fs'
import * as path from 'path'
import { IConfig } from "../config";
import { loadJSON, traverseDir } from '../util';
import { build, IBuildOption, getPlugins } from "./prebuild";


export async function buildClientRoutes (c: IConfig) {
  const {
    outputDir,
    autoGenerateClientRoutes,
    clientRoutes,
    outputAppClientDir,
    clientRoutesCSS
  } = c.pointFiles

  const myPlugins = getPlugins({
    css: clientRoutesCSS,
    mode: 'build',
    target: 'browser',
    alias: {
      '@polymita/signal-model': '@polymita/signal-model/dist/signal-model.client.esm'
    },
    runtime: 'client'
  }, c)

  const op: IBuildOption = {
    input: {
      input: autoGenerateClientRoutes,
      plugins: myPlugins,
    },
    output: {
      file: clientRoutes,
      format: 'commonjs',
    }
  }
  
  await build(c, op)
}


export async function buildViews (c: IConfig) {
  const {
    outputViewsDir,
  } = c.pointFiles

  const originalViewsDir = path.join(c.cwd, c.viewsDirectory)

  const queue: Promise<void>[] = []

  const originDirverDir = path.join(c.cwd, c.driversDirectory)

  traverseDir(originalViewsDir, f => {
    const wholePath = path.join(originalViewsDir, f.file)
    if (f.isDir) {
      if (!fs.existsSync(wholePath)) {
        fs.mkdirSync(wholePath)
      }
    } else if (/\.(j|t)sx$/.test(f.file)) {
      queue.push(new Promise<void>(async resolve => {
        const file = f.file
        const parsed = path.parse(file)

        const relativePath = path.relative(originalViewsDir, f.dir)

        const input = path.join(originalViewsDir, relativePath, file)
        const outputJS = path.join(outputViewsDir, relativePath, `${parsed.name}.js`)
        const outputCSS = path.join(outputViewsDir, relativePath, `${parsed.name}.css`)
  
        const externalDrivers = fs.existsSync(originDirverDir) ? fs.readdirSync(originDirverDir).map(f => {
          return path.join(c.cwd, c.driversDirectory, f)
        }) : []
  
        const op: IBuildOption = {
          input: {
            input,
            plugins: [
              ...getPlugins({
                css: outputCSS,
                mode: 'build',
                target: 'unit',
              }, c),
            ],
            external: [
              ...externalDrivers,
              '@polymita/signal',
              '@polymita/signal-model',
              '@polymita/renderer',
              '@polymita/connect',
              '@polymita/connect/dist/react',
              'polymita'
            ]  // use other external parameter types will conflict with auto-external plugins
          },
          output: {
            file: outputJS,
            format: 'esm'
          }
        }
        await build(c, op)

        resolve()
      }))
    }
  })
  await Promise.all(queue)
}
