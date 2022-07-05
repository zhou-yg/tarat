import { IConfig, readConfig } from "../src/config";
import { createDevServer } from "../src/server";
import * as fs from 'fs'
import * as path from 'path'
import { parseDeps } from "../src/compiler/analyzer";

import * as prettier from 'prettier'

function generateHookDeps (c: IConfig) {
  const hooksDir = path.join(c.cwd, c.hooksDirectory)
 
  fs.readdirSync(hooksDir).forEach(f => {
    const file = path.join(hooksDir, f)
    const name = f.replace(/\.js$/, '')
    if (/\.js$/.test(f) && !/\.deps\.js$/.test(f) && fs.lstatSync(file).isFile()) {
      const code = fs.readFileSync(file).toString()

      const deps = parseDeps(code)

      fs.writeFileSync(path.join(hooksDir, `${name}.deps.js`), prettier.format(
        `export default ${JSON.stringify(deps, null, 2)}`
      ))
    }
  })
}

export default async (cwd: string) => {
  const config = await readConfig({
    cwd,
  })
  
  generateHookDeps(config)

  // const fs = require('fs')
  // console.log('fs: ', fs);

  createDevServer(config)
}
