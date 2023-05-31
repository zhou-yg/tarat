import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { prepareDir } from '../../cli/dev'
import {
  buildDrivers,
  buildServerRoutes,
  generateServerRoutes,
  esbuildServerRoutes,
  generateExternal
} from '../../src'
import { readMockProjectConfig } from '../mockUtil'

jest.setTimeout(10* 1000)

describe('new server routes', () => {
  it('generate routes without compiled driver', async () => {
    const config = await readMockProjectConfig('serverRoutes')
    prepareDir(config)

    await generateServerRoutes(config);
    await esbuildServerRoutes(config)

    const { outputAppServerDir, outputAppClientDir } = config.pointFiles
    const ext = config.ts ? '.tsx' : '.jsx'
    const serverRoutesFile = join(outputAppServerDir, config.routesServer)

    expect(existsSync(serverRoutesFile + ext)).toBeTruthy()
    // compiled file
    expect(existsSync(serverRoutesFile + '.js')).toBeTruthy()

    const compiledFileContent = readFileSync(serverRoutesFile + '.js', 'utf-8');

    const hasExternal = generateExternal(config).some(externalPKG => {
      return compiledFileContent.includes(`require("${externalPKG}")`)
    })
    expect(hasExternal).toBeTruthy()

    const compiledCSSContent = readFileSync(config.pointFiles.distServerRoutesCSS, 'utf-8');
    expect(compiledCSSContent).toContain('color: red;')
    expect(compiledCSSContent).not.toContain('@tailwind base;')
  })
})