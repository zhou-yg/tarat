import { setHookAdaptor, setModelConfig } from 'tarat-core'

export default function clientRuntime (c: {
  framework: any
  name: 'react' | 'axii'
  modelConfig: any
  host: string
}
) {

  const {
    framework = {},
    name = 'react',
    modelConfig = {},
    host = '/'  
  } = c
 
  setHookAdaptor(framework, name)

  const hostConfig = `${host}${(window as any).tarotConfig?.apiPre || '_hook'}`
  const diffPath = `${host}${(window as any).tarotConfig?.diffPath || '_diff'}`

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
    async postDiffToServer(entity, diff) {
      await fetch(`${diffPath}`, {
        method: 'POST',
        body: JSON.stringify({
          entity,
          diff
        })
      })
    },
    async postComputeToServer(c) {

      const newContext = await fetch(`${hostConfig}/${c.name}`, {
        method: 'POST',
        body: JSON.stringify(c)
      }).then(r => r.json())

      return newContext
    },
    async postQueryToServer(c) {
      console.log('postQueryToServer: ');
      const newContext = await fetch(`${hostConfig}/${c.name}`, {
        method: 'POST',
        body: JSON.stringify(c)
      }).then(r => r.json())

      return newContext
    },
    ...modelConfig
  })
}