import { parseDeps } from "./analyzer";
import * as prettier from 'prettier'
import * as fs from 'fs'
import * as path from 'path'
import { IConfig } from "../config";
import { loadJSON, tryMkdir } from "../util";
import { isEqual } from "tarat-core";

const injectTagStart = '/*--tarat deps start--*/'
const injectTagEnd = '/*--tarat deps end--*/'

function template (
  origin: string,
  deps: string,
  assigns: string
) {
  return `${origin}
${injectTagStart}
const deps = ${deps}
${assigns}
${injectTagEnd}
`
}

function cleanOriginalCodeTag (code: string) {
  const rows = code.split('\n')
  let si = -1
  let ei = -1
  rows.forEach((r, i) => {
    if (r.trim() === injectTagStart) {
      si = i
    } else if (r.trim() === injectTagEnd) {
      ei = i
    }
  })
  if (si >= 0 && ei >= 0) {
    return rows.slice(0, si).concat(rows.slice(ei + 1)).join('\n')
  }
  return code
}

function equalFileContent(c1: string, c2: string) {
  return isEqual(
    c1.split('\n').map(r => r.trim()).filter(Boolean),
    c2.split('\n').map(r => r.trim()).filter(Boolean),
  )
}

export function injectDeps (c: IConfig, targetFile: string) {
  const code = fs.readFileSync(targetFile).toString()
  const parsed = path.parse(targetFile)

  const depsJSONPath = path.join(c.pointFiles.outputHooksDir, `${parsed.name}.deps.json`)

  if (fs.existsSync(depsJSONPath)) {
    const depsJSON = loadJSON(depsJSONPath)

    const arr = Object.keys(depsJSON).map(funcName => {
      return `Object.assign(${funcName}, { __deps__: deps.${funcName}, __name__: "${funcName}" })`
    })

    const codeIncludingDeps = template(
      cleanOriginalCodeTag(code),
      JSON.stringify(depsJSON).replace(/"/g, "'"),
      arr.join('\n').replace(/"/g, "'")
    )

    if (!equalFileContent(code, codeIncludingDeps)) {
      fs.writeFileSync(targetFile, codeIncludingDeps)
    }
  } else {
    throw new Error(`[injectDeps] not found deps.json with path "${depsJSONPath}"`)
  }
}

/** @TODO 1.integrated to the vite.plugin 2.upgrade to typescript */
export function generateHookDeps (c: IConfig) {
  const hooksDir = c.pointFiles.outputHooksESMDir
 
  const sourceCodeDir = path.join(c.cwd, c.hooksDirectory)

  fs.readdirSync(hooksDir).forEach(f => {
    const file = path.join(hooksDir, f)
    const name = f.replace(/\.js$/, '')
    if (/\.js$/.test(f)) {
      const code = fs.readFileSync(file).toString()

      const deps = parseDeps(code)      

      const devHooksDir = path.join(c.pointFiles.outputHooksDir)
      if (!fs.existsSync(devHooksDir)) {
        tryMkdir(devHooksDir)
      }

      // js output
      fs.writeFileSync(path.join(c.pointFiles.outputHooksDir, `${name}.deps.js`), prettier.format(
        `export default ${JSON.stringify(deps, null, 2)}`
      ))

      // json in tarat
      fs.writeFileSync(path.join(c.pointFiles.outputHooksDir, `${name}.deps.json`), (JSON.stringify(deps)))
      fs.writeFileSync(path.join(hooksDir, `${name}.deps.json`), (JSON.stringify(deps)))
    
      // injectDeps(c, path.join(c.pointFiles.outputHooksDir, f))
      // injectDeps(c, path.join(hooksDir, f))

      const sourceFile = path.join(sourceCodeDir, `${name}${c.ts ? '.ts' : '.js'}`)
      injectDeps(c, sourceFile)
    }
  })
}