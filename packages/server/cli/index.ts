import cacFactory from "cac";
import pkg from '../package.json'
import dev from "./dev";
import build from './build'
import start from './start'
import any from "./any";
import create from "./create";
import inquirer from 'inquirer'
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

cac
  .command('build', 'compile current project')
  .action(async () => {
    build(cwd)
  })

cac
  .command('start', 'starting project as service')
  .action(async () => {
    start(cwd)
  })
cac
  .command('create', 'create tarat project')
  .action(() => {

    inquirer
      .prompot([
        {
          name: 'language',
          message: 'Which language you prefer?',
          type: 'list',
          choices: ['typescript', 'javascript']
        },
      ])
      .then(({ language }) => {
        create(cwd, { useTs: language === 'typescript' })
      })
  })

cac
  .command('any')
  .action(async () => {
    any(cwd)
  })
cac.help()
cac.version(pkg.version)
cac.parse()

