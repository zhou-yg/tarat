import { IConfig, readConfig } from "../src/config";
import { createDevServer } from "../src/server";
import * as fs from 'fs'
import * as path from 'path'
import { parseDeps } from "../src/compiler/analyzer";
import exitHook from 'exit-hook'
import rimraf from 'rimraf'

import * as prettier from 'prettier'
import { buildEntryServer, buildRoutes } from "../src/compiler/build";

function generateHookDeps (c: IConfig) {
  const hooksDir = path.join(c.cwd, c.hooksDirectory)
 
  fs.readdirSync(hooksDir).forEach(f => {
    const file = path.join(hooksDir, f)
    const name = f.replace(/\.js$/, '')
    if (/\.js$/.test(f) && !/\.deps\.js$/.test(f) && fs.lstatSync(file).isFile()) {
      const code = fs.readFileSync(file).toString()

      const deps = parseDeps(code)

      fs.writeFileSync(path.join(hooksDir, `${name}.deps.js`), prettier.format(
        `export default ${JSON.stringify(deps, null, 2)}`
      ))
    }
  })
}

async function startCompile (c: IConfig) {
  rimraf.sync(c.pointFiles.outputDevDir)

  !fs.existsSync(c.pointFiles.outputDevDir) && fs.mkdirSync(c.pointFiles.outputDevDir)
  await buildRoutes(c)
  await buildEntryServer(c)
}

export default async (cwd: string) => {
  const config = await readConfig({
    cwd,
  })
    
  await startCompile(config)

  /** @TODO integrated to the vite.plugin */
  generateHookDeps(config)

  exitHook(() => {
    console.log('[exitHook] process.exit')
  })

  await createDevServer(config)
}
