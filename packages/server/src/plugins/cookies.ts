import { getPlugin, IRunningContext, loadPlugin } from 'tarat-core'

export function setCookies () {

  loadPlugin('cookie', {
    async set(s, k, value) {
      if (typeof value === 'string'){
        getPlugin('GlobalRunning').getCurrent(s)?.cookies.set(k, value)
      }
    },
    async get(s, k): Promise<any> {
      return getPlugin('GlobalRunning').getCurrent(s)?.cookies.get(k)
    },
    clear(s, k) {
      getPlugin('GlobalRunning').getCurrent(s)?.cookies.set(k, '')
    },
  })
}