import { IConfig, readConfig } from "../src/config";
import { createDevServer } from "../src/server";
import * as fs from 'fs'
import * as path from 'path'
import { parseDeps } from "../src/compiler/analyzer";
import { composeSchema } from "../src/compiler/composeSchema";
import exitHook from 'exit-hook'
import chokidar from 'chokidar'
import chalk from 'chalk'
import { buildEntryServer, buildHooks, buildRoutes } from "../src/compiler/build";
import { emptyDirectory, logFrame, tryMkdir } from "../src/util";
import * as prettier from 'prettier'

function generateHookDeps (c: IConfig) {
  const hooksDir = c.pointFiles.outputHooksESMDir
 
  fs.readdirSync(hooksDir).forEach(f => {
    const file = path.join(hooksDir, f)
    const name = f.replace(/\.js$/, '')
    if (/\.js$/.test(f)) {
      const code = fs.readFileSync(file).toString()

      const deps = parseDeps(code)      

      const devHooksDir = path.join(c.pointFiles.outputHooksDir)
      if (!fs.existsSync(devHooksDir)) {
        tryMkdir(devHooksDir)
      }

      // js output
      fs.writeFile(path.join(c.pointFiles.outputHooksDir, `${name}.deps.js`), prettier.format(
        `export default ${JSON.stringify(deps, null, 2)}`
      ), (err) => {
        if (err) {
          console.error(`[generateHookDeps] generate ${name}.deps.js fail`)
          throw err
        }
      })
      // json in tarat
      fs.writeFile(path.join(c.pointFiles.outputHooksDir, `${name}.deps.json`), (JSON.stringify(deps)), (err) => {
        if (err) {
          console.error(`[generateHookDeps] generate ${name}.deps.json fail`)
          throw err
        }
      })
    }
  })
}

function buildEverything (c: IConfig) {
  return Promise.all([
    buildRoutes(c),
    buildEntryServer(c),
    buildHooks(c)
  ])
}

function prepareDir (c: IConfig) {
  emptyDirectory(c.pointFiles.outputDir)

  // normal
  tryMkdir(c.pointFiles.outputHooksDir)
  tryMkdir(c.pointFiles.outputHooksESMDir)
  tryMkdir(c.pointFiles.outputViewsDir)
  tryMkdir(c.pointFiles.outputModelsDir)
  tryMkdir(c.pointFiles.outputViewsDir)
  
  // app
  tryMkdir(c.pointFiles.outputAppDir)
  tryMkdir(c.pointFiles.outputAppServerDir)
  tryMkdir(c.pointFiles.outputAppClientDir)
}


async function startCompile (c: IConfig) {

  prepareDir(c)

  await buildEverything(c)

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
      logFrame(`[change] ${chalk.green('re-run compiling')}`)
      buildEverything(c)
    })
    .on('add', () => {
      logFrame(`[add] ${chalk.green('re-run compiling')}`)
      buildEverything(c)
    })
    .on('unlink', () => {
      logFrame(`[unlink] ${chalk.green('re-run compiling')}`)
      buildEverything(c)
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

  /** @TODO 1.integrated to the vite.plugin 2.upgrade to typescript */
  generateHookDeps(config)

  composeSchema(config)

  await createDevServer(config)
}
