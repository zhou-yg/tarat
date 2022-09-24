const { spawn } = require("child_process")
const { writeFileSync } = require("fs")
const { join } = require("path")
const { loadJSON } = require("./utils")

const exampleDir = join(__dirname, '../packages/example/')

const pack1 = [
  'cascading-list',
  'file-uploader',
  'markdown-editor',
  'user-login-system'
]

const map = {
  p1: pack1
}

const [packType] = process.argv.slice(2)

async function buildAndPublish (dir) {
  const dirPath = join(exampleDir, dir)

  const instance = spawn('npm', ['run', 'build'], {
    cwd: dirPath,
    stdio: [process.stdin, process.stdout, process.stderr]
  })

  await new Promise((resolve, reject) => {
    instance.on('close', resolve)
    instance.on('error', reject)
  })

  const pkgJSONPath = join(dirPath, 'package.json')
  const pkgJSON = loadJSON(pkgJSONPath)
  pkgJSON.version = pkgJSON.version.replace(/\d+$/, (w) => parseInt(w) + 1)
  writeFileSync(pkgJSONPath, JSON.stringify(pkgJSON, null, 2))

  const instance2 = spawn('pnpm', ['publish', '--no-git-checks'], {
    cwd: dirPath,
    stdio: [process.stdin, process.stdout, process.stderr]
  })

  await new Promise((resolve, reject) => {
    instance2.on('close', resolve)
    instance2.on('error', reject)
  })
}

async function doTask () {
  switch (packType) {
    default: {
      for (const m of pack1) {
        await buildAndPublish(m)
      }
    }
  }
}
doTask()