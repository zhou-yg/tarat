import * as path from 'path'
import { cp } from "shelljs"
import {
  readConfig,
  buildClient,
  buildViews
} from "../src/"
import { buildEverything, prepareDir } from "./dev"

export default async (cwd: string) => {

  const config = await readConfig({
    cwd,
  })

  config.pointFiles = config.buildPointFiles

  prepareDir(config)

  await buildEverything(config)

  await Promise.all([
    buildClient(config),
    buildViews(config),
  ])

  cp(
    path.join(cwd, config.modelsDirectory, config.targetSchemaPrisma),
    path.join(config.pointFiles.outputModelsDir, config.targetSchemaPrisma)
  )
}
