import { JSONObjectTree, SingleFileModule, VirtualLayoutJSON } from "../types";
import {
  CurrentRunnerScope, Driver, getNamespace, IHookContext, Runner
} from 'atomic-signal'
import { isVirtualNode, buildLayoutNestedObj, unstable_serialize, proxyLayoutJSON, ProxyLayoutHandler, assignRules, assignPattern } from '../utils'


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
    init.current.scope.onActivate(fn)
    return () => {
      init.current.scope.deactivate(fn)
    }
  }, [])

  const [hookResult, setHookResult] = useState(init.current.result)
  return hookResult as ReturnType<T>
}

interface ModuleCache {
  props?: any;
  proxyHandler?: ProxyLayoutHandler
}

export function createReactContainer (React: any, module: SingleFileModule) {
  const cacheSymbol = Symbol('cacheSymbol')

  const runLogic = runReactLogic.bind(null, React, module.logic)

  function runLogicWithCacheProps () {
    const cache: ModuleCache = module[cacheSymbol]
    if (cache) {
      return runLogic([cache.props])
    }
    throw new Error('[runLogic] must run with cached props')
  }

  function getLayoutFromModule (props: any): ModuleCache {
    const cache: ModuleCache = module[cacheSymbol]

    if (cache) {
      return cache
    }
    const cacheObj: ModuleCache = {
      props,
    }
    if (!module[cacheSymbol]) {
      module[cacheSymbol] = cacheObj
    } else {
      module[cacheSymbol] = {
        ...module[cacheSymbol],
        ...cacheObj,
      }
    }

    const json = module.layout?.(props)
    const handler = proxyLayoutJSON(json)
    cacheObj.proxyHandler = handler

    if (json) {
      module[cacheSymbol] = {
        ...module[cacheSymbol],
        ...cacheObj,
      }
    }

    return cacheObj
  }
  function disposeFromModule () {
    delete module[cacheSymbol]
  }

  function createElementDepth (json: VirtualLayoutJSON) {
    if (!json) {
      return
    }

    let children = json.children
    if (Array.isArray(json.children)) {
      children = json.children.map(createElementDepth)
    } else if (isVirtualNode(json.children)) {
      children = createElementDepth(json.children)
    }
    return React.createElement(json.tag, json.props, children)
  }
  
  function render (props?: any) {
    if (!props) {
      props = {}
    }
    const { proxyHandler } = getLayoutFromModule(props)
    if (proxyHandler) {
      // inject & keep reference
      const rules = module.styleRules?.(props)
      if (rules) {
        assignRules(proxyHandler.draft, rules)
      }
      let newJSON = proxyHandler.apply()
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
    runLogic: runLogicWithCacheProps,
    genLayout,
  }
}