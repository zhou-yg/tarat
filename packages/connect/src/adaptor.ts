import { BM } from 'tarat-core'
export { BM } from 'tarat-core'
import { useAxiiHook } from './axii'
import { useReactHook } from './react'

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

export function useHook<T extends BM>(
  bm: T,
  args: Parameters<T>
): ReturnType<T> {
  switch (hookAdaptorType) {
    case 'react':
      return useReactHook(hookAdaptorRuntime, bm, args)
    case 'axii':
      return useAxiiHook(hookAdaptorRuntime, bm, args)
  }
  throw new Error('[useTarat] must specific a UI framework like react')
}
export const useTarat = useHook
