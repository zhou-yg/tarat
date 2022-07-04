import { BM, ReactiveChain, Runner } from 'tarat-core'
import React, { createElement, createContext } from 'react'

import { setHookAdaptor } from './adaptor'

export const DriverContext = createContext<RenderDriver | null>(null)

export function renderWithDriverContext(
  e: React.ReactElement,
  d: RenderDriver
) {
  globalThis.dc = DriverContext
  return {
    cancelAdaptor: setHookAdaptor(React, 'react'),
    root: createElement(DriverContext.Provider, { value: d }, e)
  }
}

export class RenderDriver {
  mode?: 'collect' | 'consume'

  BMValuesMap: Map<string, Runner<any>[]> = new Map()

  pushListener?: (runner: Runner<any>) => void

  pop(name: string) {
    return this.BMValuesMap.get(name)?.pop()
  }

  getContext(name: string) {
    if (this.mode !== 'consume') {
      return
    }
    return this.BMValuesMap.get(name)?.map(r =>
      r.scope.createInputComputeContext()
    )
  }

  onPush(f: (runner: Runner<any>) => void) {
    this.pushListener = f
  }

  push(runner: Runner<any>, name: string) {
    if (this.mode !== 'collect') {
      return
    }

    let values = this.BMValuesMap.get(name)
    if (!values) {
      values = []
      this.BMValuesMap.set(name, values)
    }
    this.pushListener?.(runner)
    return values.push(runner)
  }
}
