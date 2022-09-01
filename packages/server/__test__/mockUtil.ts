import { readFileSync, writeFileSync } from 'fs'
import * as path from 'path'
import {
  readConfig,
  createDevServer
} from '../src'

export function readMock (n: string) {

  return readFileSync(path.join(__dirname, './mocks', n)).toString()
}

export function writeDepsMock (n: string, deps: any) {

  return writeFileSync(path.join(__dirname, './mocks', `.${n}.deps.json`), JSON.stringify(deps))
}

export async function startTestServer () {
  const cwd = path.join(__dirname, './mockProject')
  const config = await readConfig({
    cwd,
  })

  const app = await createDevServer(config)

  return app
}
