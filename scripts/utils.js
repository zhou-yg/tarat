const fs = require('fs')
const path = require('path')
const { join, resolve, parse, relative } = require('path')
const { existsSync, mkdirSync, readFileSync, fstat, readdirSync, writeFileSync } = require('fs')

function traverseDir (dir, callback) {
  const files = fs.readdirSync(dir)
  files.forEach(f => {
    const p = path.join(dir, f)
    const isDir = fs.lstatSync(p).isDirectory()
    callback({
      isDir,
      dir,
      file: f,
      path: p
    })
    if (isDir) {
      traverseDir(p, callback)
    }
  })
}

exports.traverseDir = traverseDir

function loadJSON(f) {
  return JSON.parse(fs.readFileSync(f).toString())
}

exports.loadJSON = loadJSON

function mergeDeps (sourceDir) {
  const target = join(taratModule, PKG)
  const targetPkg = loadJSON(target)

  const subModulePkgFile = join(sourceDir, PKG)
  const subPkg = loadJSON(subModulePkgFile)

  if (subPkg.dependencies) {
    if (!targetPkg.dependencies) {
      targetPkg.dependencies = {}
    }
    const deps = Object.assign(targetPkg.dependencies, subPkg.dependencies)

    targetPkg.dependencies = {}
    Object.entries(deps).forEach(([k, v]) => {
      if (!/^workspace/.test(v)) {
        targetPkg.dependencies[k] = v
      }
    })
    writeFileSync(target, JSON.stringify(targetPkg, null, 2))
  }
}
exports.mergeDeps = mergeDeps

const packagesPath = join(__dirname, '../packages/')
const taratModule = join(packagesPath, 'tarat')
const PKG = 'package.json'

const distDir = 'dist'
exports.distDir = distDir

function replaceTaratModuleImport (sourceDir) {
  const sourceDist = join(sourceDir, distDir)
  traverseDir(sourceDist, ({ isDir, dir, file, path }) => {
    if (!isDir && /\.js$/.test(file)) {
      const relativeToOutputRoot = relative(path, sourceDist).replace(/^\.\./, '.')
      const destFile = path.replace(sourceDist, taratModule)
      const code = readFileSync(destFile).toString()

      let needWrite = false

      const newCode = code.replace(/tarat\/(\w+)/g, (moduleWithSub, sub) => {
        const subModulePkgFile = join(packagesPath, sub, PKG)
        if (existsSync(subModulePkgFile)) {
          const subPkg = loadJSON(subModulePkgFile)
          if (subPkg.main) {
            needWrite = needWrite || true
            const p = join(relativeToOutputRoot, subPkg.main.replace(`/${distDir}`, ''))
            return /^\./.test(p) ? p : `./${p}`
          }
        }
        return moduleWithSub
      })
      needWrite && writeFileSync(destFile, newCode)
    }
  })
}

exports.replaceTaratModuleImport = replaceTaratModuleImport