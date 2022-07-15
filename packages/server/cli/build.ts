import {
  readConfig,
  buildClient
} from "../src/"
import { buildEverything, prepareDir } from "./dev"

export default async (cwd: string) => {

  const config = await readConfig({
    cwd,
  })

  config.pointFiles = config.buildPointFiles

  prepareDir(config)

  await buildEverything(config)

  await buildClient(config)
}
