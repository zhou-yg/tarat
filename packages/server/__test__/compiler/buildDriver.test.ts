import {
  removeUnusedImports,
  replaceImportDriverPath
} from '../../src'

import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { driverFilesMap } from '../mockUtil'

describe('esbuild driver', () => {

  beforeEach(() => {
    Object.entries(driverFilesMap).forEach(([name, content]) => {
      writeFileSync(`./${name}.js`, content)
    })
  })
  afterAll(() => {
    Object.entries(driverFilesMap).forEach(([name, content]) => {
      unlinkSync(`./${name}.js`)
    })
  })

  it('remove unused in driver', () => {
    removeUnusedImports('./imports.js')

    const r = `


import BB, { aa } from 'foo'
import { bb } from 'foo'

function aFunc() {  
  aa()
}
bb()
const d = cc.aa.bb`
    expect(readFileSync('./imports.js').toString()).toBe(r)
  })
})