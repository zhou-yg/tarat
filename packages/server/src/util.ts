import * as fs from 'fs'
import * as path from 'path'

export function loadJSON (f: string) {
  return JSON.parse(fs.readFileSync(f).toString())
}