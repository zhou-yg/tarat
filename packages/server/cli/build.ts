import chalk from 'chalk'
import * as path from 'path'
import { cp } from "shelljs"
import {
  readConfig,
  buildClientRoutes,
  buildViews,
  generateHookDeps,
  logFrame,
} from "../src/"
import { buildEverything, prepareDir } from "./dev"

export default async (cwd: string) => {

  const config = await readConfig({
    cwd,
    isProd: true,
  })

  prepareDir(config)

  cp(
    path.join(cwd, config.modelsDirectory, config.targetSchemaPrisma),
    path.join(config.pointFiles.outputModelsDir, config.targetSchemaPrisma)
  )

  logFrame(chalk.green('prepare dir and cp models end'))

  await buildEverything(config)
  
  generateHookDeps(config)

  logFrame(chalk.green('build routes/entryServer/hooks end'))


  await Promise.all([
    buildClientRoutes(config),
    buildViews(config),
  ])

  logFrame(chalk.green('build clientRoutes/views end'))

  logFrame(chalk.green('build end'))
}
