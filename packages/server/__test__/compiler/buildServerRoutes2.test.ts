import { readdirSync, readFileSync } from "fs"
import { join } from "path"
import { prepareDir } from "../../cli/dev"
import { readConfig } from "../../src"
import { injectTagEnd, injectTagStart } from "../../src/compiler"
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

    const top = createDriverPipelineNode(config)

    await top.start()

    const myCommonDriverNode = top.find(commonDriverNode.name)
    if (myCommonDriverNode.node.type !== 'virtual') {
      const { output } = myCommonDriverNode.node
      if (output.type === 'directory') {
        const { data } = output
        readdirSync(output.data).forEach(js => {
          if (/\.js$/.test(js)) {
            // check js file rows
            const jsFile = join(data, js)
            const jsContent = readFileSync(jsFile).toString()
            const rows = jsContent.split('\n')
            expect(rows.length).toBeLessThan(50)
          }
        })
      }
    }

    const myGenerateNode = top.find(generateDepsNode.name)
    if (myGenerateNode.node.type !== 'virtual') {
      const { input } = myGenerateNode.node;
      if (input.type === 'file') {
        ([] as string[]).concat(input.data).forEach(inputDir => {
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
    }

    const serverDriverNode = top.find(`${formatDriverNode.name}-server`)
    expect(!!serverDriverNode).toBe(true)
    if (serverDriverNode.node.type !== 'virtual') {
      const { output } = serverDriverNode.node
      if (output.type === 'directory') {
        const { data } = output
        console.log('output.data: ', output.data);
        const files = readdirSync(output.data)
        expect(files.length).toBeGreaterThan(0)
        files.forEach(js => {
          if (/\.js$/.test(js)) {
            // check commonjs file
            const jsFile = join(data, js)
            const jsContent = readFileSync(jsFile).toString()
            expect(jsContent).toContain('exports')
          }
        })
      }
    }
    const clientDriverNode = top.find(`${formatDriverNode.name}-client`)
    expect(!!clientDriverNode).toBe(true)
    if (clientDriverNode.node.type !== 'virtual') {
      const { output } = clientDriverNode.node
      if (output.type === 'directory') {
        const { data } = output
        const files = readdirSync(output.data)
        expect(files.length).toBeGreaterThan(0)
        files.forEach(js => {
          if (/\.js$/.test(js)) {
            // check esm file
            const jsFile = join(data, js)
            const jsContent = readFileSync(jsFile).toString()
            expect(jsContent).toContain('import')
          }
        })
      }
    }
  })
})