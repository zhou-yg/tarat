import {
  readConfig,
  createServer
} from "../src";

export default async function start (cwd: string) {
  const config = await readConfig({
    cwd,
    isProd: true,
  })

  config.pointFiles = config.buildPointFiles

  await createServer(config)
}