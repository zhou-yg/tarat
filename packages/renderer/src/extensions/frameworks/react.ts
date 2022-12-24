import { ModuleRenderContainer, OverrideModule, SingleFileModule, StateManagementConfig, VirtualLayoutJSON } from "../../types";
import {
  CurrentRunnerScope, Driver, getNamespace, IHookContext, Runner
} from 'atomic-signal'
import {
  isVirtualNode, buildLayoutNestedObj, proxyLayoutJSON, ProxyLayoutHandler, assignRules, assignPattern,
  SEMATIC_RELATION_HAS, SEMATIC_RELATION_IS, mergeFromProps, renderHTMLProp, runOverrides } from '../../utils'

import { LayoutStructTree, ConvertToLayoutTreeDraft, PatchCommand } from "../../types-layout";
import { NormalizeProps } from "@/packages/renderer/dist/renderer";

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
  const obj: VirtualLayoutJSON['props'] = {}
  Object.keys(props).forEach(key => {
    if (key.startsWith(`${SEMATIC_RELATION_IS}-`) || key.startsWith(`${SEMATIC_RELATION_HAS}-`)) {
      obj[key] = 1
    } else if (key === renderHTMLProp) {
      obj.dangerouslySetInnerHTML =  { __html: props[key] }
    } else {
      obj[key] = props[key]
    }
  })

  return obj
}

export function createReactContainer<
  P extends Record<string, any>,
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
>(
  React: any,
  module: SingleFileModule<P, L, PCArr>,
  stateManagement: StateManagementConfig,
  options?: { useEmotion: boolean }
) {
  // shallow copy so that can mark cache in module
  module = {...module}
  const cacheSymbol = Symbol('cacheSymbol')

  const moduleConfig = module.config?.() || {}
  const moduleOverrides = module.override?.() || []
  const modulePropTypes = module.propTypes
  const runReactLogic = stateManagement?.runLogic.bind(null, React, module.logic)

  const convertProps = stateManagement?.covertProps || (<T>(props: T) => props)

  function initLogic (props?: any) {
    let cache: ModuleCache = module[cacheSymbol]
    if (cache) {
      cache.props = props
    } else {
      module[cacheSymbol] = { props }
      cache = module[cacheSymbol]
    }

    if (!runReactLogic || !module.logic) {
      return
    }
    const r = runReactLogic([props])
    cache.logicResult = r
    cache.props = props

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
    let elementArgs = [json.type, filterPatternSematicProps(json.props)]

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
  
  function construct<NewConstructPC, NewRenderPC>(props?: NormalizeProps<P>, overrides?: [
    OverrideModule<P, SingleFileModule<P, L, [...PCArr, NewRenderPC]>['layoutStruct'], NewRenderPC>,
    OverrideModule<P, SingleFileModule<P, L, [...PCArr, NewRenderPC, NewConstructPC]>['layoutStruct'], NewConstructPC>
  ]) {
    if (!props) {
      props = {} as any
    }
    /** maybe Signal */
    const convertedProps: P = convertProps(props, modulePropTypes) as unknown as P

    initLogic(props)

    const { proxyHandler } = getLayoutFromModule(convertedProps)
    if (proxyHandler) {
      // inject & keep reference
      const rules = module.styleRules?.(convertedProps, proxyHandler.draft)
      if (rules) {
        assignRules(proxyHandler.draft, rules)
      }

      runOverrides([...moduleOverrides, ...overrides], convertedProps, proxyHandler.draft)
      // console.log('[moduleOverride, ...overrides: ', moduleOverrides, overrides);
      // const mergedOverride = mergeOverrideModules([moduleOverride, ...overrides])
      // if (mergedOverride.layout) {
      //   mergedOverride.layout?.(props, proxyHandler.draft)
      // }

      let newJSON = proxyHandler.apply()
      
      // assign top attributes to root Node
      newJSON = mergeFromProps(newJSON, props, ['className', 'id', 'style'])

      const patternResult = module.designPattern?.(convertedProps)
      if (patternResult) {
        newJSON = assignPattern(newJSON, patternResult, options.useEmotion)
      }

      /** modify layout json */
      stateManagement?.transform(newJSON)

      disposeFromModule()

      return newJSON
    }
    return null
  }

  function render (json: VirtualLayoutJSON) {
    const root = createElementDepth(json)
    return root
  }

  function getLayout<T extends LayoutStructTree> (props?: any) {
    const { proxyHandler } = getLayoutFromModule(props)
    return proxyHandler?.draft as ConvertToLayoutTreeDraft<T>
  }

  return {
    render,
    construct,
    runLogic: runLogicFromCache,
    getLayout,
  }
}