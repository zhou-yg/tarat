import { Runner, BM, Driver } from 'tarat-core'
import type { IHookContext } from 'tarat-core'
import { DriverContext, RenderDriver } from '../driver'
import { unstable_serialize } from 'swr'

declare global {
  var hookContextMap: {
    [k: string]: IHookContext[]
  }
  var runner: Runner<any>
  var dc: any
}

type ArgResultMap = Map<string, any>

const driverWeakMap = new WeakMap<Driver, ArgResultMap>()

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
      init.current = cachedDriverResult
      runner.onUpdate(() => {
        setHookResult({ ...cachedDriverResult })
      })  
  
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
      init.current = r
  
      runner.onUpdate(() => {
        setHookResult({ ...init.current })
      })
      typeof window !== 'undefined' && (window.runner = runner)
    }
  }
  const [hookResult, setHookResult] = react.useState(init.current)
  return hookResult as ReturnType<T>
}
