import { readdirSync, readFileSync } from "fs"
import { join } from "path"
import { prepareDir } from "../../cli/dev"
import { readConfig, readFiles, traverse, traverseDir } from "../../src"
import { buildDrivers, buildViews, injectTagEnd, injectTagStart } from "../../src/compiler"
import {
  createClientBundlePack,
  commonDriverNode,
  generateDepsNode,
  createDriverPipelineNode, 
  formatDriverNode} from "../../src/compiler2"
import { readMockProjectConfig } from "../mockUtil"


describe('buildServerRoutes', () => {
  it('driver relative references', async () => {
    const config = await readMockProjectConfig('releativeReferrenceDriver')

    prepareDir(config)

    await buildDrivers(config)

    const { outputDriversDir, outputClientDriversDir, outputServerDriversDir } = config.pointFiles
    // check js file rows in outputDriversDir
    readFiles(outputDriversDir, '.js').forEach(file => {
      const jsContent = readFileSync(file).toString()
      const rows = jsContent.split('\n')
      expect(rows.length).toBeLessThan(50)
    })

    const r1 = readFileSync(join(outputClientDriversDir, 'a.js')).toString().match(/var autoParser/g);
    const r2 = readFileSync(join(outputClientDriversDir, 'b.js')).toString().match(/var autoParser/g);
    expect(r1.length).toBe(1)
    expect(r2.length).toBe(2)
  })
})