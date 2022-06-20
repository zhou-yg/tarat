import { Runner, BM } from 'tarat-core'

export function useReactHook<T extends BM>(react: any, hook: T, ...args: any) {
  const init = react.useRef(null)
  if (!init.current) {
    const runner = new Runner(hook)
    const r = runner.init(...args)
    init.current = r

    runner.onUpdate(() => {
      setHookResult({ ...r })
    })
    ;(window as unknown as any).runner = runner
  }
  const [hookResult, setHookResult] = react.useState(init.current)
  return hookResult as ReturnType<T> | undefined
}
