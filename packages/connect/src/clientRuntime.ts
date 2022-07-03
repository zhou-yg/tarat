import { loadPlugin } from 'tarat-core'
import { setHookAdaptor } from './adaptor'

const undefTag = '__tarat_undefined_placehodler_tag__'

export function stringifyWithUndef(data: object) {
  return JSON.stringify(data, (k, v) => {
    return v === undefined ? undefTag : v
  })
}

export function parseWithUndef(str: string) {
  return JSON.parse(str, (k, v) => {
    if (v === undefTag) {
      return undefined
    }
    return v
  })
}

export function clientRuntime(c: {
  framework: any
  name: 'react' | 'axii'
  modelConfig?: any
  host?: string
}) {
  const { framework = {}, name = 'react', modelConfig = {}, host = '/' } = c

  setHookAdaptor(framework, name)

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
        body: stringifyWithUndef(c)
      })
        .then(r => r.text())
        .then(parseWithUndef)

      return newContext
    },
    async postQueryToServer(c) {
      const newContext = await fetch(`${hostConfig}/${c.name}`, {
        method: 'POST',
        body: stringifyWithUndef(c)
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
