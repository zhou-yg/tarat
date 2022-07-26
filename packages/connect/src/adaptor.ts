import { BM } from 'tarat-core'
export { BM } from 'tarat-core'
import { useAxiiHook } from './adaptors/axii'
import { useReactHook } from './adaptors/react'

let hookAdaptorRuntime: any = null
let hookAdaptorType: 'react' | 'axii' | null = null
export function setHookAdaptor(runtime: any, type: 'react' | 'axii') {
  hookAdaptorRuntime = runtime
  hookAdaptorType = type
  return () => {
    hookAdaptorRuntime = null
    hookAdaptorType = null
  }
}

type HasParamFunc = (...arg: any[]) => any
type NoParamFunc = () => any

export function useTarat<T extends NoParamFunc, U extends Parameters<T>>(
  bm: T
): ReturnType<T>
export function useTarat<T extends HasParamFunc, U extends Parameters<T>>(
  bm: T,
  ...args: U extends [] ? [] : U
): ReturnType<T>
export function useTarat(bm: any, args?: any): any {
  switch (hookAdaptorType) {
    case 'react':
      return useReactHook(hookAdaptorRuntime, bm, args)
    case 'axii':
      return useAxiiHook(hookAdaptorRuntime, bm, args)
    default:
      throw new Error('[useTarat] must specific a UI framework like react')
  }
}
// aliass
export const useDriver = useTarat
