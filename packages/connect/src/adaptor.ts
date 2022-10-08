import { Driver } from 'tarat/core'
export { Driver } from 'tarat/core'
import {
  useReactHook,
  useReactProgress,
  IModelIndexesBase
} from './adaptors/react'

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
  driver: T
): ReturnType<T>
export function useTarat<T extends HasParamFunc, U extends Parameters<T>>(
  driver: T,
  ...args: U extends [] ? [] : U
): ReturnType<T>
export function useTarat(driver: Driver, ...args: any[]): any {
  switch (hookAdaptorType) {
    case 'react':
      return useReactHook(hookAdaptorRuntime, driver, args, currentModelIndexes)
    // case 'axii':
    //   return useAxiiHook(hookAdaptorRuntime, driver, args)
    default:
      throw new Error('[useTarat] must specific a UI framework like react')
  }
}

export function useProgress(driverResult: any) {
  switch (hookAdaptorType) {
    case 'react':
      return useReactProgress(hookAdaptorRuntime, driverResult)
  }
}

// aliass
export const useDriver = useTarat

let currentModelIndexes: IModelIndexesBase | null = null

export function registerModelIndexes(indexes: IModelIndexesBase | null) {
  currentModelIndexes = indexes
}
