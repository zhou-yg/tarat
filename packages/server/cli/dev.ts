import { IConfig, readConfig } from "../src/config";
import { createDevServer } from "../src/server";
import * as fs from 'fs'
import * as path from 'path'
import { parseDeps } from "../src/compiler/analyzer";
import { composeSchema } from "../src/compiler/composeSchema";
import exitHook from 'exit-hook'
import rimraf from 'rimraf'
import chokidar from 'chokidar'

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

      fs.writeFile(path.join(hooksDir, `${name}.deps.js`), prettier.format(
        `export default ${JSON.stringify(deps, null, 2)}`
      ), (err) => {
        if (err) {
          throw new Error(`[generateHookDeps] generate ${name}.deps.js fail`)
        }
      })
    }
  })
}

async function startCompile (c: IConfig) {
  rimraf.sync(c.pointFiles.outputDevDir)

  !fs.existsSync(c.pointFiles.outputDevDir) && fs.mkdirSync(c.pointFiles.outputDevDir)
  await buildRoutes(c)
  await buildEntryServer(c)

  const watchTarget = [
    path.join(c.cwd, c.appDirectory),
    path.join(c.cwd, c.hooksDirectory),
    path.join(c.cwd, c.viewsDirectory),
  ]

  const watcher = chokidar.watch(watchTarget, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  })

  const { log } = console

  watcher
    .on('error', console.error)
    .on('change', () => {
      log('[change] re-run compiling')
      buildRoutes(c)
      buildEntryServer(c)
    })
    .on('add', () => {
      log('[add] re-run compiling')
      buildRoutes(c)
      buildEntryServer(c)
    })
    .on('unlink', () => {
      log('[unlink] re-run compiling')
      buildRoutes(c)
      buildEntryServer(c)
    })

  
  exitHook(() => {
    console.log('[startCompile] exithook callback')
    watcher.close()
  })  
}

export default async (cwd: string) => {
  const config = await readConfig({
    cwd,
  })
    
  await startCompile(config)

  /** @TODO integrated to the vite.plugin */
  generateHookDeps(config)
  composeSchema(config)

  await createDevServer(config)
}
