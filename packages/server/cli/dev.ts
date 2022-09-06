import * as path from 'path'
import exitHook from 'exit-hook'
import chokidar from 'chokidar'
import chalk from 'chalk'
import {
  IConfig,
  readConfig,
  createDevServer,
  composeSchema,
  composeDriver,
  buildEntryServer, buildDrivers, buildServerRoutes,
  generateHookDeps,
  emptyDirectory, logFrame, tryMkdir, time
} from "../src/";

export async function buildEverything (c: IConfig) {
  
  const cost = time()

  await buildDrivers(c).then(() => {
    generateHookDeps(c)
    logFrame(`build drivers end. cost ${chalk.green(cost())} sec`)
  })

  // must executeafter driver building
  await Promise.all([
    buildServerRoutes(c).then(() => {
      logFrame(`build routes end. cost ${chalk.green(cost())} sec`)
    }),
    buildEntryServer(c).then(() => {
      logFrame(`build entryServer end. cost ${chalk.green(cost())} sec`)
    })
  ])
}

export function prepareDir (c: IConfig) {
  emptyDirectory(c.pointFiles.outputDir)

  Object.entries(c.pointFiles).forEach(([name, path]) => {
    if (/Dir$/.test(name)) {
      tryMkdir(path)
    }
  })
  // append
  tryMkdir(path.join(c.pointFiles.outputDriversDir, c.esmDirectory))
  tryMkdir(path.join(c.pointFiles.outputDriversDir, c.cjsDirectory))

  tryMkdir(path.join(c.pointFiles.outputClientDriversDir, c.esmDirectory))
  tryMkdir(path.join(c.pointFiles.outputClientDriversDir, c.cjsDirectory))

  tryMkdir(path.join(c.pointFiles.outputServerDriversDir, c.esmDirectory))
  tryMkdir(path.join(c.pointFiles.outputServerDriversDir, c.cjsDirectory))
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
    .on('add', (path) => {
      logFrame(`[add] ${chalk.green('re-run compiling')}  from "${path}"`)
      readConfig({ cwd: c.cwd }).then(newConfig => {
        buildEverything(newConfig)
      })
    })
    .on('unlink', (path) => {
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
