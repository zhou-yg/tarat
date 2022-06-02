import { IHookContext, isState, Runner, setModelConfig } from '@tarot-run/core'

const hostConfig = `http://localhost:9001/_hook`

/**
 * @TODO should provide by @tarot-run by default
 */
setModelConfig({
  async find(e, w) {
    return []
  },
  async update(e, w) {
    return []
  },
  async remove(e, d) {
    return []
  },
  async create(e, d) {
    return {}
  },
  async executeDiff(d) {},
  async postDiffToServer(d) {},
  async postComputeToServer(c) {

    const newContext: IHookContext = await fetch(hostConfig, {
      method: 'POST',
      body: JSON.stringify(c)
    }).then(r => r.json())

    return newContext
  },
})
