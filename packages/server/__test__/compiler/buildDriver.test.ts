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
    const file = './imports.js'
    removeUnusedImports(file)

    const r = `


import BB, { aa } from 'foo'
import { bb } from 'foo'

function aFunc() {  
  aa()
}
bb()
const d = cc.aa.bb`
    expect(readFileSync(file).toString()).toBe(r)
  })

  it('remove export', () => {
    const file = './withExport.js'
    removeUnusedImports(file)
    const r = `
import d2 from './a'

export { d2 as default }`
    expect(readFileSync(file).toString()).toBe(r)
  })
  it('remove export', () => {
    const file = './withExport2.js'
    removeUnusedImports(file)
    const r = `

import d2 from './a'
export default { d2 }`
    expect(readFileSync(file).toString()).toBe(r)
  })
})