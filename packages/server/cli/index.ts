import cacFactory from "cac";
import pkg from '../package.json'

import { readConfig } from "../src/config";
import { createDevServer } from "../src/server";

const cac = cacFactory('@tarot-run/server')

const cwd = process.cwd()

cac
  .command('dev', 'start service for development')
  .option('--port <port>', 'service port', {
    default: '9001'
  })
  .action(async (options: { port: number }) => {
    const config = await readConfig({
      cwd,
    })

    createDevServer(config)
  })

cac.help()
cac.version(pkg.version)
cac.parse()

