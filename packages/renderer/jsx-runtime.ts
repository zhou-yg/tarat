import * as CSS from 'csstype'
import { VirtualLayoutJSON } from './src/types'
import type { StateSignal, ComputedSignal } from 'atomic-signal'

import { h } from './src/index'

export const jsx = h;
export const jsxs = h;

export interface CSSProperties extends CSS.Properties<string | number> {
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [x: string]: VirtualLayoutJSON['props']
      input: {
        value: string | ReadonlyArray<string> | number | undefined | StateSignal<number | string> | ComputedSignal<number | string>
        [key: string]: any
      }
    }
    interface ElementAttributesProperty {
      props: {}
    }
    interface ElementChildrenAttribute {
      children: {}
    }
    interface Element extends VirtualLayoutJSON{
    }
  }
}
export {}
