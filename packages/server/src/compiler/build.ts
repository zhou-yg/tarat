import * as fs from 'fs'
import * as path from 'path'
import { IConfig } from "../config";
import { build, externals, getTsconfig, IBuildOption, getPlugins } from "./prebuild";


export async function buildClient (c: IConfig) {
  const {
    outputDir,
    autoGenerateClientRoutes,
    clientRoutes,
    clientRoutesCSS
  } = c.pointFiles


  const myPlugins = getPlugins({
    css: clientRoutesCSS,
    mode: 'build'
  }, c)

  const op: IBuildOption = {
    input: {
      input: autoGenerateClientRoutes,
      plugins: myPlugins,
      external: externals,
    },
    output: {
      file: clientRoutes,
      format: 'esm'
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
            mode: 'build'
          }, c),
          external: externals,
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
