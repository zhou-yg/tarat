const { cp } = require('shelljs')
const { join, resolve, parse } = require('path')
const { spawn, exec } = require('child_process')
const inquirer = require('inquirer')
const chokidar = require('chokidar')
const { mergeDeps, replaceTaratModuleImport } = require('./utils')

const packagesPath = join(__dirname, '../packages/')
const taratModule = join(packagesPath, 'tarat')

const names = ['server', 'core', 'connect']

const modules = names.map(n => join(taratModule, n))

const target = process.argv[2]
const targetPath = modules.find(p => p.endsWith(target))
if (targetPath) {
  buildAndWatch(target)
} else {
  inquirer
    .prompt([
      {
        name: 'module',
        message: 'Which module you want to build and watch',
        type: 'list',
        choices: names
      }
    ]).then(answers => {
      console.log('answers: ', answers);
      buildAndWatch(answers.module)
    })
}


function buildAndWatch (name) {
  const targetPath = join(packagesPath, name)
  const instance = spawn(
    'npm',
    ['run', 'build:watch'], 
    { 
      cwd: targetPath,
      stdio: ['pipe', process.stdout, process.stderr]
    }
  )

  const watcher = chokidar.watch([join(targetPath, 'dist')], {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  })
  watcher.on('change', (path) => {
    cp(
      '-r',
      join(targetPath, 'dist/*'),
      join(taratModule));
    
    replaceTaratModuleImport(targetPath)
    mergeDeps(targetPath)
  })
}