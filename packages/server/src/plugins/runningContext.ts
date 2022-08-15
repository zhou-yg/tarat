import { CurrentRunnerScope, IRunningContext, loadPlugin } from 'tarat-core'
import { join } from 'path'

let currentRunningMap: Map<CurrentRunnerScope, IRunningContext> = new Map()

export async function setRunning ()  {
  loadPlugin('GlobalRunning', {
    setCurrent (scope, api) {
      if (api) {
        currentRunningMap.set(scope, api)
      }
    },
    getCurrent (scope) {
      return currentRunningMap.get(scope) || null
    }
  })
}
