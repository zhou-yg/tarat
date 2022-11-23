import { JSONObjectTree, OverrideModule, SingleFileModule, VirtualLayoutJSON } from "../types";
import {
  CurrentRunnerScope, Driver, getNamespace, IHookContext, Runner
} from 'atomic-signal'
import { isVirtualNode, buildLayoutNestedObj, unstable_serialize, proxyLayoutJSON, ProxyLayoutHandler, assignRules, assignPattern, SEMATIC_RELATION_HAS, SEMATIC_RELATION_IS, mergeClassNameFromProps } from '../utils'


declare global {
  var dc: any
  var driverWeakMap: Map<Driver, ArgResultMap>
}

type ArgResultMap = Map<string, any>
const driverWeakMap = new Map<Driver, ArgResultMap>()

typeof window !== 'undefined' && (window.driverWeakMap = driverWeakMap)

interface ICacheDriver<T extends Driver> {
  scope: CurrentRunnerScope<T>
  result: ReturnType<T>
}

const scopeSymbol = Symbol.for('@NewRendererReactScope')

function runReactLogic<T extends Driver>(react: any, hook: T, args: Parameters<T>) {
  const { useRef, useEffect, useState } = react
  const init = useRef(null) as { current: ICacheDriver<T> | null }

  if (!init.current) {

    const serializedArgs = unstable_serialize(args)
    const cachedDriverResult: {
      scope: CurrentRunnerScope<T>
      result: ReturnType<T>
    } = driverWeakMap.get(hook)?.get(serializedArgs)

    // match the cache
    if (cachedDriverResult) {
      init.current = {
        scope: cachedDriverResult.scope,
        result: Object.assign({
          [scopeSymbol]: cachedDriverResult.scope,
        }, cachedDriverResult.result),
      }
    } else {
      const bmName: string = hook.__name__ || hook.name
      let ssrContext: IHookContext[] = []
  
      const namespace = getNamespace(hook)
      const isComposedDriver  = !!(hook as any).__tarat_compose__

      const runner = new Runner(
        hook,
        {
          updateCallbackSync: true,
          beleiveContext: true,
        }
      )

      const initialContext = ssrContext.pop()

      const scope = runner.prepareScope(args, initialContext)

      const r = runner.executeDriver(scope)

      init.current = {
        scope,
        result: Object.assign({
          [scopeSymbol]: scope,
        }, r)
      }
  
      let m = driverWeakMap.get(hook)
      if (!m) {
        m = new Map
        driverWeakMap.set(hook, m)
      }
      m.set(serializedArgs, {
        scope,
        result: r,
      })
    }
  }
  // release event
  useEffect(() => {
    function fn() {
      setHookResult({ ...init.current.result })
    }
    init.current.scope.activate()
    const unListen = init.current.scope.onUpdate(fn)
    return () => {
      init.current.scope.deactivate()
      unListen()
    }
  }, [])

  const [hookResult, setHookResult] = useState(init.current.result)
  return hookResult as ReturnType<T>
}

interface ModuleCache {
  props?: any;
  proxyHandler?: ProxyLayoutHandler
  logicResult?: any
}
/**
 * fix error:
 *    react-dom.development.js:86 Warning: Received `true` for a non-boolean attribute `is-container`.If you want to write it to the DOM, pass a string instead: is-container="true" or is-container={value.toString()}.
 */
function filterProps(props?: any) {
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

export function createReactContainer (React: any, module: SingleFileModule) {
  module = {...module}
  const cacheSymbol = Symbol('cacheSymbol')

  const runLogic = runReactLogic.bind(null, React, module.logic)

  function initLogic (props?: any) {
    const r = runLogic([props])
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
    let elementArgs = [json.tag, filterProps(json.props)]
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
  
  function render (props?: any, override?: OverrideModule) {
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

      // assignPattern(json)
      const root = createElementDepth(newJSON)
  
      disposeFromModule()

      return root
    }
    return null
  }

  function genLayout (props?: any) {
    const { proxyHandler } = getLayoutFromModule(props)
    return proxyHandler?.draft
  }

  return {
    render,
    runLogic: runLogicFromCache,
    genLayout,
  }
}