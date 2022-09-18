import { CurrentRunnerScope, IRunningContext, loadPlugin } from 'tarat/core'
import { join } from 'path'

let currentRunningMap: Map<CurrentRunnerScope, IRunningContext> = new Map()

export async function setRunning ()  {
  loadPlugin('GlobalRunning', {
    setCurrent (scope, api) {
      // console.trace('scope, api: ', !!scope, api);
      currentRunningMap.set(scope, api)
    },
    getCurrent (scope) {
      // console.log('currentRunningMap: ', currentRunningMap);
      return currentRunningMap.get(scope) || null
    }
  })
}
