import { CurrentRunnerScope, IRunningContext, loadPlugin } from 'tarat-core'
import { join } from 'path'

let currentRunningMap: Map<CurrentRunnerScope, IRunningContext> = new Map()

export async function setRunning ()  {
  loadPlugin('GlobalRunning', {
    setCurrent (s, api) {
      if (api) {
        currentRunningMap.set(s, api)
      }
    },
    getCurrent (s) {
      return currentRunningMap.get(s) || null
    }
  })
}
