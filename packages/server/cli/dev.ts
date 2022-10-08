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
  emptyDirectory, logFrame, tryMkdir, time, buildModelIndexes
} from "../src/";

export async function buildEverything (c: IConfig) {
  
  const cost = time()

  await buildModelIndexes(c).then(() => {
    logFrame(`build modelIndexes end. cost ${chalk.green(cost())} sec`)
  })

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

  // append
  tryMkdir(path.join(c.pointFiles.outputClientDir))
  tryMkdir(path.join(c.pointFiles.outputServerDir))
  tryMkdir(path.join(c.pointFiles.outputClientDir, c.driversDirectory))
  tryMkdir(path.join(c.pointFiles.outputServerDir, c.driversDirectory))
  
  Object.entries(c.pointFiles).forEach(([name, path]) => {
    if (/Dir$/.test(name)) {
      tryMkdir(path)
    }
  })
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
  const watcher2 = chokidar.watch([
    path.join(c.cwd, c.modelsDirectory, c.targetSchemaPrisma)
  ], {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  })
  watcher2.on('change', path => {
    buildModelIndexes(c).then(() => {
      logFrame(`build modelIndexes end. cost ${chalk.green(cost())} sec`)
    })  
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

  await Promise.all([
    composeSchema(config),
    composeDriver(config)  
  ])
  
  await startCompile(config)

  await createDevServer(config)
}
