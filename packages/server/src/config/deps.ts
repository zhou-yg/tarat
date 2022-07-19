import { loadJSON } from "../util"
import * as path from 'path'

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
    const r1 = !!loadJSON(path.join(dir, 'package.json')).tarat

    return r1
  })

  return modules
}
