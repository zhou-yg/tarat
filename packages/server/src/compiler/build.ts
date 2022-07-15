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
