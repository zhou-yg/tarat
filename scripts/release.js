const { cp } = require('shelljs')
const { join, resolve, parse } = require('path')
const { spawn, exec } = require('child_process')
const chalk = require('chalk')
const { existsSync, mkdirSync, readFileSync, fstat, readdirSync } = require('fs')
const rimraf = require('rimraf')
const inquirer = require('inquirer')
const { versionBump } = require('@jsdevtools/version-bump-prompt/lib/version-bump')
const { traverseDir, loadJSON } = require('./utils')

const packagesPath = join(__dirname, '../packages/')
const taratModule = join(packagesPath, 'tarat')
const coreModule = join(packagesPath, 'core')
const connectModule = join(packagesPath, 'connect')
const serverModule = join(packagesPath, 'server')

const distDir = 'dist'

const modules = [
  coreModule,
  connectModule,
  serverModule,
]

function replaceTaratModuleImport (sourceDir) {
  const sourceDist = join(sourceDir, distDir)
  traverseDir(sourceDist, ({ isDir, dir, file, path }) => {
    if (!isDir) {
      const destFile = path.replace(sourceDist, taratModule)
      const code = readFileSync(destFile).toString()
      code.replace(/tarat\/(\w+)/g, (moduleWithSub, sub) => {
        console.log('moduleWithSub, sub: ', moduleWithSub, sub);
        const subModulePkgFile = join(packagesPath, sub, 'package.json')
        if (existsSync(subModulePkgFile)) {
          const subPkg = loadJSON(subModulePkgFile)
          if (subPkg.main) {
            return subPkg.main.replace(`/${distDir}`, '')
          }
        }
        return moduleWithSub
      })
    }
  })
}

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
    const taratPkg = JSON.parse(readFileSync(join(taratModule, 'package.json')).toString())
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