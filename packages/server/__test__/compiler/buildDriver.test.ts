import {
  removeUnusedImports,
  clearFunctionBody,
  clearedFunctionBodyPlaceholder
} from '../../src'

import { readFileSync, unlinkSync, writeFileSync } from 'fs'
import { driverFilesMap } from '../mockUtil'

describe('esbuild driver result', () => {

  describe('build driver result', () => {
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
        const d = cc.aa.bb
      `
      expect(readFileSync(file).toString().replace(/\s/g, '')).toBe(r.replace(/\s/g, ''))
    })
  
    it('remove export', () => {
      const file = './withExport.js'
      removeUnusedImports(file)
      const r = `
  import d2 from './a'
  
  export { d2 as default }`
      expect(readFileSync(file).toString().replace(/\s/g, '')).toBe(r.replace(/\s/g, ''))
    })
    it('remove export', () => {
      const file = './withExport2.js'
      removeUnusedImports(file)
      const r = `
  
  import d2 from './a'
  export default { d2 }`
      expect(readFileSync(file).toString().replace(/\s/g, '')).toBe(r.replace(/\s/g, ''))
    })
  })


  describe('esbuild driver:clear function body', () => {
    it('simple', () => {
      const code = `
        const inputFile = state<{ name: string }>()
        const OSSLink = computedInServer(() => a() + 1)
      `
      const r = `
        const inputFile = state<{ name: string }>()
        const OSSLink = computedInServer(${clearedFunctionBodyPlaceholder})
      `
      const r0 = clearFunctionBody(code, ['computedInServer'])
      expect(r0).toBe(r)
    })  
    it('generate function', () => {
      const code = `
        const inputFile = state<{ name: string }>()
        const OSSLink = computedInServer(function * () {
          const file = inputFile()
        })`
      const r = `
        const inputFile = state<{ name: string }>()
        const OSSLink = computedInServer(${clearedFunctionBodyPlaceholder})`
      const r0 = clearFunctionBody(code, ['computedInServer'])
      expect(r0).toBe(r)
    })  
    it('generate with generics', () => {
      const code = `
        const inputFile = state<{ name: string }>()
        const OSSLink = computedInServer<any ? () => void : string<T>>(function * () {
          const file = inputFile()
        })`
      const r = `
        const inputFile = state<{ name: string }>()
        const OSSLink = computedInServer<any ? () => void : string<T>>(${clearedFunctionBodyPlaceholder})`
      const r0 = clearFunctionBody(code, ['computedInServer'])
      expect(r0).toBe(r)
    })  
    it('generate with complex generics', () => {
      const code = `
        const inputFile = state<{ name: string }>()
        const OSSLink3 = computedInServer<T extends object? (number) : (string) >
        (function * () {
          if (file) {
            return 'a'
          }
        })
      `
      const r = `
        const inputFile = state<{ name: string }>()
        const OSSLink3 = computedInServer<T extends object? (number) : (string) >
        (${clearedFunctionBodyPlaceholder})
      `
      const r0 = clearFunctionBody(code, ['computedInServer'])
      expect(r0).toBe(r)
    })
    it('real case', () => {
      const code = `
import {
  computed,
  state,
  computedInServer,
} from 'tarat-core'
import axios from 'axios'

async function uploadFile (f: Buffer | File) {
  /* @__PURE__ */
  const a = axios.get
}

export default function uploader<T> () {
  // only in browser
  const inputFile = state<{ name: string }>()

  const OSSLink = computedInServer(function * () {
    const file = inputFile()
    if (file) {
      return 'a'
    }
    return 'b'
  })
  return {
    inputFile,
    OSSLink
  }
}
      `
      const r = `
import {
  computed,
  state,
  computedInServer,
} from 'tarat-core'
import axios from 'axios'

async function uploadFile (f: Buffer | File) {
  /* @__PURE__ */
  const a = axios.get
}

export default function uploader<T> () {
  // only in browser
  const inputFile = state<{ name: string }>()

  const OSSLink = computedInServer(${clearedFunctionBodyPlaceholder})
  return {
    inputFile,
    OSSLink
  }
}
      `
      const r0 = clearFunctionBody(code,  [ 'inputComputeInServer', 'computedInServer', 'model', 'prisma' ])
      expect(r0).toBe(r)
    })
  })
})

