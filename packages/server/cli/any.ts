import {
  readConfig,
  hooksType,
} from "../src/"

export default async (cwd: string) => {

  const config = await readConfig({
    cwd,
  })

  await hooksType(config, config.pointFiles.outputHooksDir)
}