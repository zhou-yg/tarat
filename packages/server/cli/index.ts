import cacFactory from "cac";
import pkg from '../package.json'

import devServer from "../src/devServer";

const cac = cacFactory('@tarot-run/server')

cac
  .command('dev', 'start service for development')
  .option('--port <port>', 'service port', {
    default: '9001'
  })
  .action((options: { port: number }) => {
    
  })

cac.help()
cac.version(pkg.version)
cac.parse()

