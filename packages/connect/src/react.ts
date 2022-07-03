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
  if (!init.current) {
    let ssrContext =
      typeof window !== 'undefined' ? window.hookContextMap?.[hook.name] : []

    const runner = new Runner(hook)
    driver?.push(runner, hook.name)

    const r = runner.init(args, ssrContext.pop())
    init.current = r

    runner.onUpdate(() => {
      setHookResult({ ...r })
    })
    typeof window !== 'undefined' && (window.runner = runner)
  }
  const [hookResult, setHookResult] = react.useState(init.current)
  return hookResult as ReturnType<T> | undefined
}
