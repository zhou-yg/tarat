/**
 * 匹配
 *  in React framework, runReactLogic
 *  in Vue, runVueLogic
 *  in Other, by extension institution
 */
import {
  after,
  Computed,
  CurrentRunnerScope, Driver, getNamespace, IHookContext, isSignal, Runner, signal, State, StateSignal
} from 'atomic-signal'
import { PropTypeValidator, SignalProps, StateManagementConfig, VirtualLayoutJSON } from '../../types'
import { isFunction, last, traverse, traverseLayoutTree } from '../../utils'
import { SignalFlag, typeFlagSymbol } from '../../lib/propTypes'

export const config: StateManagementConfig = {
  matches: [
    {
      renderFramework: 'react',
      stateManagement: 'signal',
    }
  ],
  runLogic: runReactLogic,
  transform,
  covertProps: convertToSignal
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
          (key === 'value' || key === 'checked')&& 
          node.type === 'input'
        ) {

          const eventType = key === 'value' ? 'onInput' : 'onChange'

          const fns: ((...args: any[]) => void)[] = [
            (e: { target: { value: number | string } }) => {
              console.log('e.target[key]: ', e.target[key]);
              value(e.target[key])
            },
          ]
          if (props[eventType] && isFunction(props[eventType])) {
            fns.push(props[eventType])
          }
          props[key] = value()
          props[eventType] = function reactSignalTransformOnEventType (e: { target: { value: number | string, checked: boolean } }) {
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
  signalProps: Record<string, StateSignal<any> | Function>
}

export function convertToSignal<T extends Record<string, any>> (
  props: T,
  propTypes?: Record<string, PropTypeValidator>
): SignalProps<T> {
  const signalArgs = {}
  Object.entries(props || {}).forEach(([key, value]) => {
    const propType = propTypes?.[key]

    if (
      propType?.[typeFlagSymbol] === SignalFlag &&
      !isSignal(value) &&
      !isFunction(value)
    ) {
      signalArgs[key] = signal(value)
    } else {
      signalArgs[key] = value
    }
  })
  return signalArgs as SignalProps<T>
}

const scopeSymbol = Symbol.for('@NewRendererReactScope')

function runReactLogic<T extends Driver>(react: any, hook: T, props: Parameters<T>) {
  const { useRef, useEffect, useState } = react
  const init = useRef(null) as { current: ICacheDriver<T> | null }
  const signalProps = props[0]

  if (!init.current) {

    let ssrContext: IHookContext[] = []

    const runner = new Runner(
      hook,
      {
        updateCallbackSync: true,
        beleiveContext: true,
      }
    )

    const initialContext = ssrContext.pop()

    const scope = runner.prepareScope([signalProps] as Parameters<T>, initialContext)

    const r = runner.executeDriver(scope)

    init.current = {
      scope,
      result: Object.assign({
        [scopeSymbol]: scope,
      }, r),
      signalProps,
    }
  }

  const [upc, updatePropsCount] = useState(0)
  // watch props
  useEffect(() => {
    let unListenCallbacks: Function[] = []
    if (init.current) {
      const { signalProps } = init.current
      const deps = Object.values(signalProps).filter((v: any) => isSignal(v)) as StateSignal<any>[]
      const unListen = after(() => {
        updatePropsCount((v: number) => v + 1)
      }, deps)
      unListenCallbacks.push(unListen)
    }
    return () => {
      unListenCallbacks.forEach(fn => fn())
    }
  }, [])

  useEffect(() => {
    if (init.current) {
      const { signalProps } = init.current

      Object.entries(signalProps[0] || {}).forEach(([key, value]) => {
        if (!isFunction(value) && isSignal(signalProps[key] as any)) { 
          signalProps[key](value)
        }
      })
    }
  }, [signalProps[0]])

  // confirm only run once in React18 with strict mode or in development
  // const didMount = useRef(false)
  // release event
  useEffect(() => {
    // if (didMount.current === true) return
    // didMount.current = true

    init.current.scope.activate()
    const unListen = init.current.scope.onUpdate(() => {
      console.log('init.current.result: ', init.current.result);
      setHookResult({ ...init.current.result })
    })

    return () => {
      unListen()
      init.current.scope.deactivate()
      init.current.scope.dispose()
      init.current = null
      // didMount.current = false
    }
  }, [])

  const [hookResult, setHookResult] = useState(init.current.result)
  return hookResult as ReturnType<T>
}
