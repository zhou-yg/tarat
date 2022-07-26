import { Runner, BM } from 'tarat-core'
import type { IHookContext } from 'tarat-core'
import { DriverContext, RenderDriver } from './driver'

declare global {
  var hookContextMap: {
    [k: string]: IHookContext[]
  }
  var runner: Runner<any>
  var dc: any
}

export function useReactHook<T extends BM>(react: any, hook: T, ...args: any) {
  const init = react.useRef(null)
  const driver: RenderDriver = react.useContext(DriverContext)
  const bmName: string = hook.__name__ || hook.name
  if (!init.current) {
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
      setHookResult({ ...r })
    })
    typeof window !== 'undefined' && (window.runner = runner)
  }
  const [hookResult, setHookResult] = react.useState(init.current)
  return hookResult as ReturnType<T>
}
