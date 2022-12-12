import type {
  RenderContainer,
  StateManagementConfig
} from './types'

export const DEFAULT_STATE_MANAGEMENT = 'signal'

export class ExtensionCore {
  stateManagementConfigs = new Set<StateManagementConfig>()
  add(m: StateManagementConfig) {
    this.stateManagementConfigs.add(m)
  }
  // remove(m: StateManagementConfig) {
  //   this.stateManagementConfigs.delete(m)
  // }
  /**
   * @TODO only match first one
   */
  match(framework: string, stateManagement: string = DEFAULT_STATE_MANAGEMENT) {
    let result: StateManagementConfig[] = []

    const firstMatchedResult = Array.from(this.stateManagementConfigs).find(
      m => {
        const r = m.matches.some(match => {
          return (
            match.renderFramework === framework &&
            match.stateManagement === stateManagement
          )
        })
        if (r) {
          result.push(m)
        }
        return r
      }
    )
    if (result.length > 1) {
      console.error(
        `ExtensionCore match more than one result, please check your config:`,
        result
      )
    }
    return firstMatchedResult
  }

  containerCreators = new Map<string, RenderContainer<any, any, any>>()

  getContainerCreator(frameworkName: string): RenderContainer<any, any, any> {
    const containerCreator = this.containerCreators.get(frameworkName)
    if (!containerCreator) {
      throw new Error(`No container found for framework: ${frameworkName}`)
    }
    return containerCreator
  }

  addContainerCreator(frameworkName: string, container: RenderContainer<any, any, any>) {
    this.containerCreators.set(frameworkName, container)
  }
}

export const extensionCore = new ExtensionCore()

/**
 * @TODO provisional built-in
 */

import * as signal from './extensions/stateManagements/react-signal'

extensionCore.add(signal.config)

import { createReactContainer } from './extensions/frameworks/react'

extensionCore.addContainerCreator('react', createReactContainer)
