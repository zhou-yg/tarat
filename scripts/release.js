const { join, resolve } = require('path')
const { spawn, exec } = require('child_process')
const chalk = require('chalk')

const packagesPath = join(__dirname, '../packages/')

const coreModule = join(packagesPath, 'core')
const connectModule = join(packagesPath, 'connect')
const serverModule = join(packagesPath, 'server')

function build(cwd) {
  return new Promise((resolve, reject) => {
    exec('npm', ['run build'], {
      cwd
    }, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        console.log(stdout?.toString())
        if (stderr) {
          console.error(chalk.red(stderr.toString()))
        }
        resolve()
      }
    })  
  })
}

build(coreModule)
  .then(() => {
    return build(connectModule)
  }).then(() => {
    return build(serverModule)
  })