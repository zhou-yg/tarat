import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { prepareDir } from '../../cli/dev'
import {
  buildDrivers,
  buildServerRoutes
} from '../../src'
import { readMockProjectConfig } from '../mockUtil'

jest.setTimeout(10* 1000)

describe('server routes', () => {
  it('generate routes without compiled driver', async () => {
    const config = await readMockProjectConfig('serverRoutes')
    prepareDir(config)

    await buildServerRoutes(config)

    const { outputAppServerDir, outputAppClientDir } = config.pointFiles
    const ext = config.ts ? '.tsx' : '.jsx'
    const serverRoutesFile = join(outputAppServerDir, config.routesServer)

    expect(existsSync(serverRoutesFile + ext)).toBeTruthy()
    // compiled file
    console.log('serverRoutesFile+js: ', serverRoutesFile + '.js');
    expect(existsSync(serverRoutesFile + '.js')).toBeTruthy()

    // compiled file content
    const jsContent = readFileSync(serverRoutesFile + '.js').toString()
    expect(jsContent.indexOf('autoParser')).toBe(-1)
  })
  it('generate routes with compiled driver', async () => {
    const config = await readMockProjectConfig('serverRoutes')
    prepareDir(config)

    await buildDrivers(config)
    await buildServerRoutes(config)

    const { outputAppServerDir, outputAppClientDir } = config.pointFiles
    const ext = config.ts ? '.tsx' : '.jsx'
    const serverRoutesFile = join(outputAppServerDir, config.routesServer)

    expect(existsSync(serverRoutesFile + ext)).toBeTruthy()
    // compiled file
    expect(existsSync(serverRoutesFile + '.js')).toBeTruthy()

    // compiled file content
    const jsContent = readFileSync(serverRoutesFile + '.js').toString()
    expect(jsContent.indexOf('autoParser')).toBeGreaterThan(-1)
  }, 10 * 1000)
})