const { cp } = require('shelljs')
const { join, resolve, parse, relative } = require('path')
const { spawn, exec } = require('child_process')
const chalk = require('chalk')
const { existsSync, mkdirSync, readFileSync, fstat, readdirSync, writeFileSync } = require('fs')
const rimraf = require('rimraf')
const inquirer = require('inquirer')
const { versionBump } = require('@jsdevtools/version-bump-prompt/lib/version-bump')
const { replaceTaratModuleImport, mergeDeps, distDir } = require('./utils')

const packagesPath = join(__dirname, '../packages/')
const taratModule = join(packagesPath, 'tarat')
const coreModule = join(packagesPath, 'core')
const connectModule = join(packagesPath, 'connect')
const serverModule = join(packagesPath, 'server')

const PKG = 'package.json'

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

        // 复制文件
        cp(
          '-r',
          join(cwd, distDir, '*'),
          join(taratModule));

        // 替换文件内模块
        replaceTaratModuleImport(cwd, distDir)
        // 合并依赖
        mergeDeps(cwd)

        resolve()
      }
    })  
  })
}

function publish () {
  return new Promise(resolve => {
    console.log('npm pulibsh');
    exec(`npm publish`, { cwd: taratModule }, (err, stdout) => {
      if (err) {
        throw err
      }
      if (stdout) {
        console.log(stdout);
      }
      resolve()
    })
  })
}

function commit () {
  return new Promise(resolve => {
    console.log('git commit');
    const taratPkg = JSON.parse(readFileSync(join(taratModule, PKG)).toString())
    exec(`git commit -a -m "release: tarat v${taratPkg.version} "`, (err, stdout) => {
      if (err) {
        throw err
      }
      if (stdout) {
        console.log(stdout);
      }
      resolve()
    })
  })
}


build(coreModule)
  .then(() => {
    return build(connectModule)
  }).then(() => {
    return build(serverModule)
  }).then(() => {
    return versionBump({
      cwd: taratModule
    })
  }).then(() => {
    return commit()
  }).then(() => {
    return publish()
  })