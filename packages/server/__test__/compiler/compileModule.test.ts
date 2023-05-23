import path from 'node:path'
import fs from 'node:fs'
import {
  buildModules, traverseDir,
} from '../../src'
import { readMockProjectConfig } from '../mockUtil'

describe('compile modules', () => {

  it('read mock project', async () => {
    const c = await readMockProjectConfig('hasModules')

    await buildModules(c)

    const originalModulesDir = path.join(c.cwd, c.modulesDirectory);
    const { outputModulesDir } = c.pointFiles;
    traverseDir(originalModulesDir, f => {
      const wholePath = path.join(outputModulesDir, f.file)

      const obj = path.parse(wholePath);
      obj.ext = '.js';
      obj.base = obj.base.replace(/\.(t|j)s(x?)/, '.js')

      const outputJS = path.format(obj)

      expect(fs.existsSync(outputJS)).toBeTruthy()
    })
  })
})