const { cp } = require('shelljs')
const { join, resolve, parse } = require('path')
const { spawn, exec } = require('child_process')
const chalk = require('chalk')
const { existsSync, mkdirSync } = require('fs')
const rimraf = require('rimraf')
const inquirer = require('inquirer')
const { versionBump } = require('@jsdevtools/version-bump-prompt/lib/version-bump')

const packagesPath = join(__dirname, '../packages/')


const taratModule = join(packagesPath, 'tarat')
const taratPkg = require(join(taratModule, 'package.json'))

const coreModule = join(packagesPath, 'core')
const connectModule = join(packagesPath, 'connect')
const serverModule = join(packagesPath, 'server')

const distDir = 'dist'

const modules = [
  coreModule,
  connectModule,
  serverModule,
]

function build(cwd) {

  console.log(`start building ${chalk.green(cwd)} \n`)

  return new Promise((resolve, reject) => {
    exec('npm run build', {
      cwd
    }, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        console.log(stdout?.toString())
        if (stderr) {
          console.error('error:' + chalk.red(stderr.toString()))
        }
        console.log(`\nend building`)


        cp(
          '-r',
          join(cwd, distDir, '*'),
          join(taratModule));

        resolve()
      }
    })  
  })
}

// moveDist()
build(coreModule)
  .then(() => {
    return build(connectModule)
  }).then(() => {
    return build(serverModule)
  }).then(() => {
    return versionBump({
      cwd: taratModule,
      commit: 'release: tarat v%s'
    })
  }).then(r => {
    console.log('end: ', r);
  })