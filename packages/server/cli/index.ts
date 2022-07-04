import cacFactory from "cac";
import pkg from '../package.json'
import dev from "./dev";

const cac = cacFactory('tarat-server')

const cwd = process.cwd()

cac
  .command('dev', 'start service for development')
  .option('--port <port>', 'service port', {
    default: '9001'
  })
  .action(async (options: { port: number }) => {
    dev(cwd)
  })

cac.help()
cac.version(pkg.version)
cac.parse()

