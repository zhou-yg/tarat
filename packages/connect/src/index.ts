export * from './axii'
export * from './react'

import { useAxiiHook } from './axii'
import { useReactHook } from './react'

let hookAdaptorRuntime: any = null
let hookAdaptorType: 'react' | 'axii' | null = null
export function setHookAdaptor(runtime: any, type: 'react' | 'axii') {
  hookAdaptorRuntime = runtime
  hookAdaptorType = type
}

export type BM = (...prop: any) => any

export function useHook<T extends BM>(bm: T): ReturnType<T> | undefined {
  switch (hookAdaptorType) {
    case 'react':
      return useReactHook(hookAdaptorRuntime, bm)
    case 'axii':
      return useAxiiHook(hookAdaptorRuntime, bm)
  }
}
export const useTarat = useHook
