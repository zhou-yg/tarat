import { readdirSync, readFileSync } from "fs"
import { join } from "path"
import { readConfig } from "../../src"
import { injectTagEnd, injectTagStart } from "../../src/compiler/"
import { createClientBundlePack, commonDriverNode, generateDepsNode } from "../../src/compiler2/"
import { readMockProjectConfig } from "../mockUtil"


describe('buildServerRoutes', () => {
  it('driver relative references', async () => {
    const config = await readMockProjectConfig('releativeReferrenceDriver')

    const top = createClientBundlePack(config)

    await top.start()

    const myCommonDriverNode = top.findChild(commonDriverNode.name)
    if (myCommonDriverNode.node.type !== 'virtual') {
      const { output } = myCommonDriverNode.node
      readdirSync(output).forEach(js => {
        if (/\.js$/.test(js)) {
          // check js file rows
          const jsFile = join(output, js)
          const jsContent = readFileSync(jsFile).toString()
          const rows = jsContent.split('\n')
          expect(rows.length).toBeLessThan(50)
        }
      })
    }

    const myGenerateNode = top.findChild(generateDepsNode.name)
    if (myGenerateNode.node.type !== 'virtual') {
      const { input } = myGenerateNode.node;
      ([] as string[]).concat(input).forEach(inputDir => {
        readdirSync(inputDir).forEach(js => {
          if (/\.js$/.test(js)) {
            // check js file rows
            const jsFile = join(inputDir, js)
            const jsContent = readFileSync(jsFile).toString()
            // check is has inject tag
            expect(jsContent).toContain(injectTagStart)
            expect(jsContent).toContain(injectTagEnd)
          }
        })      
      })
    }
  })
})