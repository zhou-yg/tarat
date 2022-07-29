import { loadJSON, logFrame } from "../util"
import * as path from 'path'
import { existsSync } from "fs"
import chalk from 'chalk'

interface IPkg {
  dependencies: {
    [k: string]: string
  }
}
export function findDependencies (cwd: string) {
  const pkgJSON: IPkg = loadJSON(path.join(cwd, 'package.json'))
  const pkgModules = Object.keys(pkgJSON.dependencies)

  const modules: string[] = pkgModules.filter(moduleName => {
    const dir = path.join(cwd, 'node_modules', moduleName)
    const pkg = path.join(dir, 'package.json')
    if (existsSync(pkg)) {
      const r1 = !!loadJSON(pkg).tarat
      return r1
    } else {
      logFrame(chalk.red(`dependency module "${moduleName}" hasnt installed`))
    }
  })

  return modules
}
