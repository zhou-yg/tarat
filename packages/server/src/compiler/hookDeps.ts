import { parseDeps } from "./analyzer";
import * as prettier from 'prettier'
import * as fs from 'fs'
import * as path from 'path'
import { IConfig } from "../config";
import { loadJSON, tryMkdir } from "../util";

function template (
  origin: string,
  deps: string,
  assigns: string
) {
  return `${origin}
const deps = ${deps}

${assigns}
`
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
      code,
      JSON.stringify(depsJSON),
      arr.join('\n')
    )

    fs.writeFileSync(targetFile, codeIncludingDeps)
  } else {
    throw new Error(`[injectDeps] not found deps.json with path "${depsJSONPath}"`)
  }
}

export function generateHookDeps (c: IConfig) {
  const hooksDir = c.pointFiles.outputHooksESMDir
 
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
    
      injectDeps(c, path.join(c.pointFiles.outputHooksDir, f))
      injectDeps(c, path.join(hooksDir, f))
    }
  })
}