import { Runner, BM, Driver, EScopeState } from 'tarat-core'
import type { IHookContext } from 'tarat-core'
import { DriverContext, RenderDriver } from '../driver'
import { unstable_serialize } from 'swr'

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

const scopeSymbol = Symbol.for('@taratScope')

export interface IProgress {
  state: EScopeState
}

export function useReactProgress<T extends Driver> (react: any, result: ReturnType<T>): IProgress | null {

  const state = result[scopeSymbol].getState()

  return {
    state,
  }
}

export function useReactHook<T extends BM>(react: any, hook: T, ...args: any) {
  const init = react.useRef(null)
  const driver: RenderDriver = react.useContext(DriverContext)

  if (!init.current) {

    const serializedArgs = unstable_serialize(args)
    const cachedDriverResult: {
      runner: Runner<T>
      result: ReturnType<T>
    } = driverWeakMap.get(hook)?.get(serializedArgs)

    // match the cache
    if (cachedDriverResult) {
      init.current = {
        runner: cachedDriverResult.runner,
        result: Object.assign({
          [scopeSymbol]: cachedDriverResult.runner.scope,
        }, cachedDriverResult.result),
      }
    } else {
      const bmName: string = hook.__name__ || hook.name
      let ssrContext: IHookContext[] = []
      if (driver) {
        ssrContext = driver.getContext(bmName) || []
      } else {
        ssrContext =
          typeof window !== 'undefined'
            ? window.hookContextMap?.[bmName] || []
            : []
      }
  
      const runner = new Runner(hook, { beleiveContext: driver?.beleiveContext })
      driver?.push(runner, bmName)
  
      const initialContext = ssrContext.pop()
      const r = runner.init(args, initialContext)
      init.current = {
        runner,
        result: Object.assign({
          [scopeSymbol]: runner.scope,
        }, r)
      }
  
      let m = driverWeakMap.get(hook)
      if (!m) {
        m = new Map
        driverWeakMap.set(hook, m)
      }
      m.set(serializedArgs, {
        runner,
        result: r,
      })
    }
  }
  // release event
  react.useEffect(() => {
    function fn() {
      setHookResult({ ...init.current.result })
    }
    init.current.runner.scope.activate(fn)
    return () => {
      init.current.runner.scope.deactivate(fn)
    }
  }, [])

  const [hookResult, setHookResult] = react.useState(init.current.result)
  return hookResult as ReturnType<T>
}
