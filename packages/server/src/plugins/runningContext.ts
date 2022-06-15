import { IRunningContext, loadPlugin } from 'tarat-core'
import { join } from 'path'

let currentRunning: IRunningContext | null = null

export async function setRunning ()  {
  loadPlugin('GlobalRunning', {
    setCurrent (api) {
      currentRunning = api
    },
    getCurrent () {
      return currentRunning
    }
  })
}
