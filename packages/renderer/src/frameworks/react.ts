import { JSONObjectTree, OverrideModule, SingleFileModule, StateManagementConfig, VirtualLayoutJSON } from "../types";
import {
  CurrentRunnerScope, Driver, getNamespace, IHookContext, Runner
} from 'atomic-signal'
import { isVirtualNode, buildLayoutNestedObj, unstable_serialize, proxyLayoutJSON, ProxyLayoutHandler, assignRules, assignPattern, SEMATIC_RELATION_HAS, SEMATIC_RELATION_IS, mergeClassNameFromProps } from '../utils'
import { ExtensionCore } from "../extension";

type ArgResultMap = Map<string, any>
const driverWeakMap = new Map<Driver, ArgResultMap>()

typeof window !== 'undefined' && (window.driverWeakMap = driverWeakMap)

interface ModuleCache {
  props?: any;
  proxyHandler?: ProxyLayoutHandler
  logicResult?: any
}
/**
 * fix error:
 *    react-dom.development.js:86 Warning: Received `true` for a non-boolean attribute `is-container`.If you want to write it to the DOM, pass a string instead: is-container="true" or is-container={value.toString()}.
 */
function filterPatternSematicProps(props?: any) {
  if (!props) {
    return props
  }
  const obj = {}
  Object.keys(props).forEach(key => {
    if (key.startsWith(`${SEMATIC_RELATION_IS}-`) || key.startsWith(`${SEMATIC_RELATION_HAS}-`)) {
      obj[key] = 1
    } else {
      obj[key] = props[key]
    }
  })
  return obj
}

export function createReactContainer (
  React: any,
  module: SingleFileModule,
  extensionCore: ExtensionCore
) {
  module = {...module}
  const cacheSymbol = Symbol('cacheSymbol')

  const moduleConfig = module.config?.() || {}

  const stateManagement = extensionCore.match('react', moduleConfig.logicLib?.name)
  
  const runReactLogic = stateManagement?.runLogic.bind(null, React, module.logic)

  function initLogic (props?: any) {
    if (!runReactLogic) {
      return
    }
    const r = runReactLogic([props])
    const cache: ModuleCache = module[cacheSymbol]
    if (cache) {
      cache.logicResult = r
      cache.props = props
    } else [
      module[cacheSymbol] = { logicResult: r, props }
    ]
    return r
  }

  function runLogicFromCache () {
    const cache: ModuleCache = module[cacheSymbol]
    if (cache) {
      return cache.logicResult
    }
    throw new Error('[runLogic] must run with cached props')
  }

  function getLayoutFromModule (props: any): ModuleCache {
    const cache: ModuleCache = module[cacheSymbol]

    if (cache && cache.proxyHandler) {
      return cache
    }

    const json = module.layout?.(props)
    const handler = proxyLayoutJSON(json)
    
    if (json) {
      cache.proxyHandler = handler
    }

    return cache
  }
  function disposeFromModule () {
    delete module[cacheSymbol]
  }

  function createElementDepth (json: VirtualLayoutJSON) {
    if (!json) {
      return
    }
    if (!isVirtualNode(json)) {
      return json
    }
    let children = json.children
    let elementArgs = [json.tag, filterPatternSematicProps(json.props)]

    if (Array.isArray(json.children)) {
      children = json.children.map(createElementDepth)
      elementArgs.push(...children)
    } else {
      if (isVirtualNode(json.children)) {
        children = createElementDepth(json.children)
      }
      elementArgs.push(children)
    }
    return React.createElement(...elementArgs)
  }
  
  function construct (props?: any, override?: OverrideModule) {
    if (!props) {
      props = {}
    }
    initLogic(props)

    const { proxyHandler } = getLayoutFromModule(props)
    if (proxyHandler) {
      // inject & keep reference
      const rules = module.styleRules?.(props)
      if (rules) {
        assignRules(proxyHandler.draft, rules)
      }

      if (override) {
        override.layout?.(proxyHandler.draft)
      }

      let newJSON = proxyHandler.apply()
      
      newJSON = mergeClassNameFromProps(newJSON, props)

      const patternResult = module.designPattern?.(props)
      if (patternResult) {
        newJSON = assignPattern(newJSON, patternResult)
      }

      /** modify layout json */
      stateManagement?.transform(newJSON)
      // assignPattern(json)
      // const root = createElementDepth(newJSON) 

      disposeFromModule()

      return newJSON
    }
    return null
  }

  function render (json: VirtualLayoutJSON) {
    const root = createElementDepth(json)
    return root
  }

  function getLayout (props?: any) {
    const { proxyHandler } = getLayoutFromModule(props)
    return proxyHandler?.draft
  }

  return {
    render,
    construct,
    runLogic: runLogicFromCache,
    getLayout,
  }
}