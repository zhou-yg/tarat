import { Runner, Driver, EScopeState, CurrentRunnerScope, getNamespace } from 'tarat/core'
import { useRef, useEffect, useState, useContext } from 'react'
import type { IHookContext } from 'tarat/core'
import { DriverContext, RenderDriver } from '../driver'
import { unstable_serialize } from 'swr'

export interface IModelIndexesBase {
  [k: string]: string | IModelIndexesBase
}


declare global {
  var hookContextMap: {
    [k: string]: IHookContext[]
  }
  var runner: Runner<any>
  var dc: any
  var driverWeakMap: Map<Driver, ArgResultMap>
}

type ArgResultMap = Map<string, any>

const driverWeakMap = new Map<Driver, ArgResultMap>()

typeof window !== 'undefined' && (window.driverWeakMap = driverWeakMap)

const scopeSymbol = Symbol.for('@taratReactScope')

export interface IProgress {
  state: EScopeState
}

export function useReactProgress<T extends Driver> (react: any, result: ReturnType<T>): IProgress | null {

  const state = result[scopeSymbol].getState()

  return {
    state,
  }
}

interface ICacheDriver<T extends Driver> {
  scope: CurrentRunnerScope<T>
  result: ReturnType<T>
}

export function useReactHook<T extends Driver>(react: any, hook: T, args: Parameters<T>, currentModelIndexes: IModelIndexesBase) {
  const init = useRef(null) as { current: ICacheDriver<T> | null }
  const driver: RenderDriver = useContext(DriverContext)

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
      if (driver) {
        ssrContext = driver.getContext(bmName) || []
      } else {
        throw new Error('[useTarat] must provide a DriverContext at Root ')
      }
  
      const namespace = getNamespace(hook)
      const isComposedDriver  = !!(hook as any).__tarat_compose__

      const runner = new Runner(
        hook,
        {
          beleiveContext: driver.beleiveContext,
          updateCallbackSync: driver.updateCallbackSync,
          modelIndexes: namespace && currentModelIndexes && isComposedDriver ? currentModelIndexes[namespace] as IModelIndexesBase : currentModelIndexes
        }
      )

      const initialContext = ssrContext.pop()

      const scope = runner.prepareScope(args, initialContext)
      driver?.push(scope, bmName)

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
    init.current.scope.activate(fn)
    return () => {
      init.current.scope.deactivate(fn)
    }
  }, [])

  const [hookResult, setHookResult] = useState(init.current.result)
  return hookResult as ReturnType<T>
}
