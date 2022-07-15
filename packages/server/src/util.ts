import * as fs from 'fs'
import * as path from 'path'
import rimraf from 'rimraf'
import { IViewConfig } from './config'
import os from "os";

export function loadJSON (f: string) {
  return JSON.parse(fs.readFileSync(f).toString())
}

export function emptyDirectory (dir: string) {
  rimraf.sync(dir)

  fs.mkdirSync(dir)
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


export function last<T extends any[]>(arr: T) {
  return arr[arr.length - 1]
}

export function logFrame (content: string, length = 60) {
  const line = new Array(length).fill('-').join('')
  const rows = content.split('\n').map(c => {
    return c.trim().match(new RegExp(`.{1,${length - 4}}`, 'g'))
  }).filter(Boolean).flat()
  
  const padLen = length - 4

  return console.log(
    [
      line,
      ...(rows?.map(s => `| ${s}`) || []),
      line
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