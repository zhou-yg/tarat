import { StateManagementConfig, StateManagementMatch } from "./types"

export const DEFAULT_STATE_MANAGEMENT = 'signal'

export class ExtensionCore {
  stateManagementConfigs = new Set<StateManagementConfig>()
  add (m: StateManagementConfig) {
    this.stateManagementConfigs.add(m)
  }
  remove (m: StateManagementConfig) {
    this.stateManagementConfigs.delete(m)
  }
  /**
   * @TODO only match first one
   */
  match (framework: string, stateManagement: string = DEFAULT_STATE_MANAGEMENT) {
    let result: StateManagementConfig[] = []

    const firstMatchedResult = Array.from(this.stateManagementConfigs)
      .find(m => {
        const r = m.matches.some(match => {
          return match.renderFramework === framework && match.stateManagement === stateManagement
        })
        if (r) {
          result.push(m)
        }
        return r
      })
    if (result.length > 1) {
      console.error(`ExtensionCore match more than one result, please check your config:`,  result)
    }
    return firstMatchedResult
  }
}

export const extensionCore = new ExtensionCore()

/**
 * @TODO provisional built-in
 */

import * as signal from './stateManagements/react-signal'

extensionCore.add(signal.config)