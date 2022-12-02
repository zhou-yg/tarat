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
import { StateManagementConfig, VirtualLayoutJSON } from '../../types'
import { isFunction, last, traverse, traverseLayoutTree, unstable_serialize } from '../../utils'

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
          props.value = value()
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
  signalProps: Record<string, StateSignal<any>>
}

function convertArgsToSignal (args: Record<string, any> = {}) {
  const signalArgs: Record<string, StateSignal<any>> = {}
  Object.entries(args).forEach(([key, value]) => {
    if (isSignal(value)) {
      signalArgs[key] = value
    } else if (!isFunction(value)) {
      signalArgs[key] = signal(value)
    }
  })
  return signalArgs
}

const scopeSymbol = Symbol.for('@NewRendererReactScope')

function runReactLogic<T extends Driver>(react: any, hook: T, props: Parameters<T>) {
  const { useRef, useEffect, useState } = react
  const init = useRef(null) as { current: ICacheDriver<T> | null }

  if (!init.current) {
    const signalProps = convertArgsToSignal(props[0])

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
      const deps = Object.values(signalProps).filter(v => isSignal(v))
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

      Object.entries(props[0] || {}).forEach(([key, value]) => {
        if (!isFunction(value)) { 
          signalProps[key](value)
        }
      })
    }
  }, [props[0]])

  // confirm only run once in React18 with strict mode or in development
  const didMount = useRef(false)
  // release event
  useEffect(() => {
    if (didMount.current === true) return
    didMount.current = true

    init.current.scope.activate()
    const unListen = init.current.scope.onUpdate(() => {
      setHookResult({ ...init.current.result })
    })

    return () => {
      unListen()
      init.current.scope.deactivate()
      init.current.scope.dispose()
      init.current = null
      didMount.current = false
    }
  }, [])

  const [hookResult, setHookResult] = useState(init.current.result)
  return hookResult as ReturnType<T>
}
