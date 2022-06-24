import { Runner, BM } from 'tarat-core'
import type { IHookContext } from 'tarat-core'

declare global {
  var hookContextMap: {
    [k: string]: IHookContext
  }
  var runner: Runner<any>
}

export function useReactHook<T extends BM>(react: any, hook: T, ...args: any) {
  const init = react.useRef(null)
  if (!init.current) {
    let ssrContext = window.hookContextMap?.[hook.name]

    const runner = new Runner(hook)
    const r = runner.init(args, ssrContext)
    init.current = r

    runner.onUpdate(() => {
      setHookResult({ ...r })
    })
    window.runner = runner
  }
  const [hookResult, setHookResult] = react.useState(init.current)
  return hookResult as ReturnType<T> | undefined
}
