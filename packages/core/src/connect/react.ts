import { Runner } from '../core'
import { BM } from '../util'

export function useReactHook<T extends BM> (react: any, hook: T, ...args: any) {
  const [hookResult, setHookResult] = react.useState()

  react.useEffect(() => {
    const runner = new Runner(hook)
    const r = runner.init(...args)
  
    runner.onUpdate(() => {
      mapStateToReactive()
    })
    
    function mapStateToReactive () {
      setHookResult({...r})
    }
    mapStateToReactive()
  }, [])

  return hookResult as ReturnType<T> | undefined
}