import { Runner } from '../core'

export function useReactHook (react: any, hook: () => void, ...args: any[]) {

  const [hookResult, setHookResult] = react.useState(null)

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

  return hookResult
}