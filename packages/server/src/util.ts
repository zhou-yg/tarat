import * as fs from 'fs'
import * as path from 'path'
import rimraf from 'rimraf'

export function loadJSON (f: string) {
  return JSON.parse(fs.readFileSync(f).toString())
}

export function emptyDirectory (dir: string) {
  rimraf.sync(dir)

  fs.mkdirSync(dir)
}