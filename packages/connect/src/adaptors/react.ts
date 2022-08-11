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
type ResultRunnerMap = Map<any, Runner<any>>

const resultRunnerWeakMap = new WeakMap<any, Runner<any>>()
const driverWeakMap = new Map<Driver, ArgResultMap>()

typeof window !== 'undefined' && (window.driverWeakMap = driverWeakMap)

export interface IProgress {
  state: EScopeState
}

export function useReactProgress<T extends Driver> (react: any, result: ReturnType<T>): IProgress | null {
  const init = react.useRef(null)
  if (!init.current) {
    const runner = resultRunnerWeakMap.get(result)
    if (runner) {
      init.current = {
        state: runner.state()
      }
    }
  }

  return init.current
}

export function useReactHook<T extends BM>(react: any, hook: T, ...args: any) {
  const init = react.useRef(null)
  const driver: RenderDriver = react.useContext(DriverContext)

  const uneffectCallbacks = react.useRef([])

  if (!init.current) {

    const serializedArgs = unstable_serialize(args)
    const cachedDriverResult: {
      runner: Runner<T>
      result: ReturnType<T>
    } = driverWeakMap.get(hook)?.get(serializedArgs)

    // match the cache
    if (cachedDriverResult) {
      init.current = {
        result: cachedDriverResult.result,
        runner: cachedDriverResult.runner
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
        result: r
      }
  
      let m = driverWeakMap.get(hook)
      if (!m) {
        m = new Map
        driverWeakMap.set(hook, m)
      }
      resultRunnerWeakMap.set(r, runner)
      m.set(serializedArgs, {
        runner,
        result: r,
      })
    }
  }
  // release event
  react.useEffect(() => {
    init.current.runner.scope.onUpdate(() => {
      setHookResult({ ...init.current.result })
    })
    init.current.runner.scope.activate()
    return () => {
      init.current.runner.scope.deactivate()
    }
  })

  const [hookResult, setHookResult] = react.useState(init.current.result)
  return hookResult as ReturnType<T>
}
