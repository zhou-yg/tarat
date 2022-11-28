/**
 * 匹配
 *  in React framework, runReactLogic
 *  in Vue, runVueLogic
 *  in Other, by extension institution
 */
import {
  CurrentRunnerScope, Driver, getNamespace, IHookContext, isSignal, Runner
} from 'atomic-signal'
import { StateManagementConfig, VirtualLayoutJSON } from '../types'
import { isFunction, last, traverse, traverseLayoutTree, unstable_serialize } from '../utils'

export const config: StateManagementConfig = {
  matches: [
    {
      renderFramework: 'react',
      stateManagement: 'signal',
    }
  ],
  runLogic: runReactLogic,
  transform,
}

function transform (json: VirtualLayoutJSON) {
  // ** cant clone, json maybe include React.Element instance
  traverseLayoutTree(json, (node: VirtualLayoutJSON) => {
    if (node.props) {
      const { props } = node
      Object.entries(props).forEach(([key, value]) => {
        // if support two binding calling
        if (
          isSignal(value) &&
          key === 'value' && 
          node.tag === 'input'
        ) {
          const fns: ((...args: any[]) => void)[] = [
            (e: { target: { value: number | string } }) => {
              value(e.target.value)
            },
          ]
          if (props.onInput && isFunction(props.onInput)) {
            fns.push(props.onInput)
          }
          props.onInput = function reactSignalTransformOnInput (e: { target: { value: number | string } }) {
            fns.forEach(fn => {
              fn(e)
            })
          }
        }
      })
    }
  })
  return json
}

declare global {
  var dc: any
  var driverWeakMap: Map<Driver, ArgResultMap>
}

type ArgResultMap = Map<string, any>
const driverWeakMap = new Map<Driver, ArgResultMap>()

typeof window !== 'undefined' && (window.driverWeakMap = driverWeakMap)

interface ICacheDriver<T extends Driver> {
  scope: CurrentRunnerScope<T>
  result: ReturnType<T>
}

const scopeSymbol = Symbol.for('@NewRendererReactScope')

function runReactLogic<T extends Driver>(react: any, hook: T, args: Parameters<T>) {
  const { useRef, useEffect, useState } = react
  const init = useRef(null) as { current: ICacheDriver<T> | null }

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
  
      const namespace = getNamespace(hook)
      const isComposedDriver  = !!(hook as any).__tarat_compose__

      const runner = new Runner(
        hook,
        {
          updateCallbackSync: true,
          beleiveContext: true,
        }
      )

      const initialContext = ssrContext.pop()

      const scope = runner.prepareScope(args, initialContext)

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
    init.current.scope.activate()
    const unListen = init.current.scope.onUpdate(fn)
    return () => {
      init.current.scope.deactivate()
      unListen()
    }
  }, [])

  const [hookResult, setHookResult] = useState(init.current.result)
  return hookResult as ReturnType<T>
}
