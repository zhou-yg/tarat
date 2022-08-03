import * as path from 'path'
import exitHook from 'exit-hook'
import chokidar from 'chokidar'
import chalk from 'chalk'
import {
  IConfig,
  readConfig,
  createDevServer,
  composeSchema,
  buildEntryServer, buildDrivers, buildRoutes,
  generateHookDeps,
  emptyDirectory, logFrame, tryMkdir, composeDriver, time
} from "../src/";

export async function buildEverything (c: IConfig) {
  
  const cost = time()

  await Promise.all([
    buildRoutes(c).then(() => {
      logFrame(`build routes end. cost ${chalk.green(cost())} sec`)
    }),
    buildEntryServer(c).then(() => {
      logFrame(`build entryServer end. cost ${chalk.green(cost())} sec`)
    }),
    buildDrivers(c).then(() => {
      logFrame(`build drivers end. cost ${chalk.green(cost())} sec`)
    })
  ])

  generateHookDeps(c)
}

export function prepareDir (c: IConfig) {
  emptyDirectory(c.pointFiles.outputDir)

  // normal
  tryMkdir(c.pointFiles.outputDriversDir)
  tryMkdir(c.pointFiles.outputDriversESMDir)
  tryMkdir(c.pointFiles.outputViewsDir)
  tryMkdir(c.pointFiles.outputModelsDir)
  tryMkdir(c.pointFiles.outputViewsDir)
  
  // app
  tryMkdir(c.pointFiles.outputAppDir)
  tryMkdir(c.pointFiles.outputAppServerDir)
  tryMkdir(c.pointFiles.outputAppClientDir)
}


async function startCompile (c: IConfig) {

  const cost = time()

  logFrame('prepare')

  prepareDir(c)

  await buildEverything(c)

  const watchTarget = [
    path.join(c.cwd, c.appDirectory),
    path.join(c.cwd, c.driversDirectory),
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
    .on('change', (path) => {
      if (/(\.css|\.less|\.scss)$/.test(path)) {
        return
      }

      const cost = time()
      logFrame(`[change] re-run compiling from "${path}"`)
      readConfig({ cwd: c.cwd }).then(newConfig => {
        return buildEverything(newConfig)
      }).then(() => {
        logFrame(`[change] comipling ${chalk.green(cost())} sec`)
      })
    })
    .on('add', () => {
      logFrame(`[add] ${chalk.green('re-run compiling')}  from "${path}"`)
      readConfig({ cwd: c.cwd }).then(newConfig => {
        buildEverything(newConfig)
      })
    })
    .on('unlink', () => {
      logFrame(`[unlink] ${chalk.red('re-run compiling')}  from "${path}"`)
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
  composeDriver(config)

  await createDevServer(config)
}
