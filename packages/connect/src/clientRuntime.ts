import { loadPlugin, ModelEvent, setGlobalModelEvent } from 'tarat/core'
import { setHookAdaptor } from './adaptor'
import { serializeJSON, parseWithUndef, stringifyWithUndef } from './utils'

export function clientRuntime(c: {
  framework: any
  name: 'react' | 'axii'
  modelConfig?: any
  host?: string
}) {
  const { framework = {}, name = 'react', modelConfig = {}, host = '/' } = c

  setHookAdaptor(framework, name)

  const me = new ModelEvent()
  setGlobalModelEvent(me)

  const hostConfig = `${host}${(window as any).taratConfig?.apiPre || '_hook'}`
  const diffPath = `${host}${(window as any).taratConfig?.diffPath || '_diff'}`

  /**
   * @TODO should provide by @tarat-run by default
   */
  loadPlugin('Model', {
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
    ...modelConfig
  })

  loadPlugin('Context', {
    async postDiffToServer(entity, diff) {
      await fetch(`${diffPath}`, {
        method: 'POST',
        body: stringifyWithUndef({
          entity,
          diff
        })
      })
    },
    async postComputeToServer(c) {
      const newContext = await fetch(`${hostConfig}/${c.name}`, {
        method: 'POST',
        body: serializeJSON(c)
      })
        .then(r => r.text())
        .then(parseWithUndef)

      return newContext
    },
    async postQueryToServer(c) {
      const newContext = await fetch(`${hostConfig}/${c.name}`, {
        method: 'POST',
        body: serializeJSON(c)
      })
        .then(r => r.text())
        .then(parseWithUndef)

      return newContext
    },
    ...modelConfig
  })

  loadPlugin('Cache', {
    async getValue(k, f) {
      return undefined
    },
    async setValue(k, v, f) {},
    clearValue(k, f) {}
  })
}
