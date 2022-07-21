import * as path from 'path'
import exitHook from 'exit-hook'
import chokidar from 'chokidar'
import chalk from 'chalk'
import {
  IConfig,
  readConfig,
  createDevServer,
  composeSchema,
  buildEntryServer, buildHooks, buildRoutes,
  generateHookDeps,
  emptyDirectory, logFrame, tryMkdir
} from "../src/";

export async function buildEverything (c: IConfig) {
  
  await Promise.all([
    buildRoutes(c),
    buildEntryServer(c),
    buildHooks(c)
  ])

  generateHookDeps(c)
}

export function prepareDir (c: IConfig) {
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

  watcher
    .on('error', console.error)
    .on('change', () => {
      logFrame(`[change] ${chalk.green('re-run compiling')}`)
      readConfig({ cwd: c.cwd }).then(newConfig => {
        buildEverything(newConfig)
      })
    })
    .on('add', () => {
      logFrame(`[add] ${chalk.green('re-run compiling')}`)
      readConfig({ cwd: c.cwd }).then(newConfig => {
        buildEverything(newConfig)
      })
    })
    .on('unlink', () => {
      logFrame(`[unlink] ${chalk.green('re-run compiling')}`)
      readConfig({ cwd: c.cwd }).then(newConfig => {
        buildEverything(newConfig)
      })
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

  composeSchema(config)

  await createDevServer(config)
}
