import { getPlugin, IRunningContext, loadPlugin } from 'tarat-core'

export function setCookies () {

  loadPlugin('cookie', {
    async set(k, value) {
      if (value && typeof value === 'string'){
        getPlugin('GlobalRunning').getCurrent()?.cookies.set(k, value)
      }
    },
    async get(k): Promise<any> {
      return getPlugin('GlobalRunning').getCurrent()?.cookies.get(k)
    },
    clear(k) {
      getPlugin('GlobalRunning').getCurrent()?.cookies.set(k, '')
    },
  })
}