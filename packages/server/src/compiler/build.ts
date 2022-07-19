import * as fs from 'fs'
import * as path from 'path'
import { IConfig } from "../config";
import { loadJSON } from '../util';
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
      'tarat-core': 'tarat-core/dist/index.client.js',
    }
  }, c)

  const pkg = loadJSON(path.join(c.cwd, 'package.json'))

  const op: IBuildOption = {
    input: {
      input: autoGenerateClientRoutes,
      plugins: myPlugins,
    },
    output: {
      file: clientRoutes,
      name: `${pkg.name}TaratApp`,
      format: 'umd',
      // manualChunks: {
      //   dll: [
      //     'react',
      //     'react-dom',
      //     'tarat-core',
      //     'tarat-connect'
      //   ]
      // }
    }
  }
  
  await build(c, op)
}


export async function buildViews (c: IConfig) {
  const {
    outputViewsDir,
  } = c.pointFiles

  const originalViewsDir = path.join(c.cwd, c.viewsDirectory)

  await Promise.all(fs.readdirSync(originalViewsDir)
    .filter(file => /\.(j|t)sx$/.test(file))
    .map(async file => {
      const parsed = path.parse(file)

      const input = path.join(originalViewsDir, file)
      const outputJS = path.join(outputViewsDir, `${parsed.name}.js`)
      const outputCSS = path.join(outputViewsDir, `${parsed.name}.css`)

      const op: IBuildOption = {
        input: {
          input,
          plugins: getPlugins({
            css: outputCSS,
            mode: 'build',
            alias: {
              'tarat-core': 'tarat-core/dist/index.client.js',
            }
          }, c),
        },
        output: {
          file: outputJS,
          format: 'esm'
        }
      }
      await build(c, op)
    })
  )
}
