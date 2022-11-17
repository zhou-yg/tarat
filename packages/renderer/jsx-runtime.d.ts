import * as CSS from 'csstype'

import { VirtualLayoutJSON } from './src/types'

export interface CSSProperties extends CSS.Properties<string | number> {
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [x: string]: VirtualLayoutJSON['props']
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
