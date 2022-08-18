import { BM, CurrentRunnerScope, IHookContext, ReactiveChain, Runner } from 'tarat-core'
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

  eanbleCache = true

  beleiveContext = false

  BMValuesMap: Map<string, CurrentRunnerScope<any>[]> = new Map()

  pushListener?: (scope: CurrentRunnerScope<any>) => void

  consumeCache: Map<string, IHookContext[] | undefined> = new Map()

  switiToConsumeMode() {
    this.mode = 'consume'
    this.beleiveContext = true
  }

  pop(name: string) {
    return this.BMValuesMap.get(name)?.pop()
  }

  getContext(name: string) {
    if (this.mode !== 'consume') {
      return
    }
    let r = this.consumeCache.get(name)
    if (!r) {
      r = this.BMValuesMap.get(name)?.map(s =>
        s.createInputComputeContext()
      )
      this.consumeCache.set(name, r)
    }

    return r
  }

  onPush(f: (scope: CurrentRunnerScope<any>) => void) {
    this.pushListener = f
  }

  push(scope: CurrentRunnerScope<any>, name: string) {
    if (this.mode !== 'collect') {
      return
    }

    let values = this.BMValuesMap.get(name)
    if (!values) {
      values = []
      this.BMValuesMap.set(name, values)
    }
    this.pushListener?.(scope)
    return values.push(scope)
  }
}
