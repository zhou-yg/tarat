import { readFileSync, writeFileSync } from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

export function readMock (n: string) {

  return readFileSync(path.join(__dirname, './mocks', n)).toString()
}

export function writeDepsMock (n: string, deps: any) {

  return writeFileSync(path.join(__dirname, './mocks', `.${n}.deps.json`), JSON.stringify(deps))
}