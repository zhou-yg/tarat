import chalk from 'chalk'
import { fstat } from 'fs'
import * as path from 'path'
import * as fs from 'fs'
import { cp } from "shelljs"
import {
  readConfig,
  buildClientRoutes,
  buildViews,
  generateHookDeps,
  logFrame,
  time,
} from "../src/"
import { buildEverything, prepareDir } from "./dev"

export default async (cwd: string) => {

  const config = await readConfig({
    cwd,
    isProd: true,
  })

  const allCost = time()

  logFrame(chalk.green('prepare dir and cp models'))

  prepareDir(config)

  if (fs.existsSync(path.join(cwd, config.modelsDirectory, config.targetSchemaPrisma))) {
    cp(
      path.join(cwd, config.modelsDirectory, config.targetSchemaPrisma),
      path.join(config.pointFiles.outputModelsDir, config.targetSchemaPrisma)
    )
  }

  logFrame(chalk.green('build routes/entryServer/drivers'))

  const cost = time()

  await buildEverything(config)
  
  generateHookDeps(config)

  logFrame(chalk.green(`build routes/entryServer/drivers end. cost ${cost()} seconds`))

  logFrame(chalk.green('build clientRoutes/views'))

  const cost2 = time()

  await Promise.all([
    buildClientRoutes(config).then(() => {
      logFrame(chalk.green(`build clientRoutes end. cost ${cost2()} seconds`))    
    }),
    buildViews(config).then(() => {
      logFrame(chalk.green(`build views end. cost ${cost2()} seconds`))    
    }),
  ])

  logFrame(chalk.green(`build end. cost ${allCost()} seconds`))
}
