import * as fs from 'fs'
import * as path from 'path'
import rimraf from 'rimraf'
import { IViewConfig } from './config'
import os from "os";
import { BM, isEqual } from "tarat/core";

export function loadJSON (f: string) {
  return JSON.parse(fs.readFileSync(f).toString())
}

export function emptyDirectory (dir: string) {
  if (fs.existsSync(dir)) {
    rimraf.sync(dir)
  }

  fs.mkdirSync(dir)
}

export function lowerFirst (s: string) {
  return s[0].toLowerCase() + s.substring(1)
}

export function isComposedDriver (f: BM) {
  return !!(f as any).__tarat_compose__
}

export function tryMkdir(dir: string) {
  !fs.existsSync(dir) && fs.mkdirSync(dir)
}

export function getDefeaultRoute (pages: IViewConfig[]) {
  let root: IViewConfig = pages[0]
  pages.forEach(p => {
    const p1 = p.path.split('/')
    const p2 = root.path.split('/')
    if (p1.length <= p2.length) {
      if (p1.length === p2.length) {
        root = p.index ? p : root
      } else {
        root = p
      }
    }
  })

  return root.name === 'index' ? '' : root.name
}

export function logFrame (content: string, length = 100) {
  const lineArr = new Array(length).fill('-')  
  const line2 = lineArr.join('')

  const title = ' tarat '
  lineArr.splice(1, 0, title)
  const line1 = lineArr.slice(0, -title.length).join('')

  const rows = content.split('\n').map(c => {
    return c.trim().match(new RegExp(`.{1,${length - 4}}`, 'g'))
  }).filter(Boolean).flat()
  
  const padLen = length - 4

  return console.log(
    [
      line1,
      ...(rows?.map(s => `| ${s}`) || []),
      line2
    ].join('\n')
  )
}

export function getAddress() {
  const address =
    process.env.HOST ||
    Object.values(os.networkInterfaces())
      .flat()
      .find((ip) => ip?.family === "IPv4" && !ip.internal)?.address;

  return address
}

export function equalFileContent(c1: string, c2: string) {
  return isEqual(
    c1.split('\n').map(r => r.trim()).filter(Boolean),
    c2.split('\n').map(r => r.trim()).filter(Boolean),
  )
}

export function isFileEmpty (code: string) {
  return code.replace(/\n/g, '').trim().length === 0
}

interface IFile {
  isDir: boolean
  path: string
  file: string
  dir: string
}
export function traverseDir (dir: string, callback: (f: IFile) => void) {
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

export function time (sec = true) {
  let st = Date.now()
  return () => {
    const v = Date.now() - st
    return sec ? Math.floor(v / 1000) : v
  }
}

export function __aa () {

}


export function traverse(
  target: Record<string, any>,
  callback: (arrPath: string[], value: any) => void,
  parentKeys?: string[]
) {
  if (!parentKeys) {
    parentKeys = []
  }
  Object.entries(target).forEach(([key, value]) => {
    const currentKeys = parentKeys.concat(key)
    value && callback(currentKeys, value)
    if (typeof value === 'object' && value) {
      traverse(value, callback, currentKeys)
    }
  })
}

export function last<T> (arr: T[]):T {
  return arr[arr.length - 1]
}


// read all files in directory
export function readFiles (dir: string, ext: string = '') {
  // check file
  if (fs.lstatSync(dir).isFile()) {
    return dir.endsWith(ext) ? [dir] : []
  }

  const files: string[] = []
  traverseDir(dir, (file) => {
    if (!file.isDir) {
      if (ext) {
        if (file.file.endsWith(ext)) {
          files.push(file.path)
        }
      } else {
        files.push(file.path)
      }
    }
  })
  return files
}