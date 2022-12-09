/* @jsxFactory h  */
import {
  createComponent,
  h,
  matchPatternMatrix,
  StyleRule,
  useLayout,
  useLogic,
  useModule
} from '../src/index'
import { BaseDataType, SingleFileModule, VirtualLayoutJSON } from '../src/types'
import { signal } from 'atomic-signal'

export interface MockReactElement {
  // $$typeof: symbol
  props: Record<string, any>
  type: string | Function
  children?:
    | (BaseDataType | MockReactElement)[]
    | MockReactElement
    | BaseDataType
}

export const MockRectFramework = {
  name: 'react',
  lib: {
    createElement(
      type: string | Function,
      props: Record<string, any> | null,
      ...children: MockReactElement[]
    ): MockReactElement {
      return {
        // $$typeof: Symbol.for('react.element'),
        type,
        props: props || {},
        children:
          children.length === 0
            ? undefined
            : children.length === 1
            ? children[0]
            : children
      }
    },
    useRef: (v = null) => ({ current: v }),
    useState: (v = undefined) => [v, () => {}],
    useEffect: () => {}
  }
}

export function simpleModule(): SingleFileModule {
  return {
    logic() {
      return {}
    },
    layout() {
      return <div></div>
    }
  }
}

export function moduleHasMultipleChild(): SingleFileModule {
  return {
    logic() {
      return {}
    },
    layout() {
      return (
        <div id="1">
          <div>1</div>
          <div>2</div>
        </div>
      )
    }
  }
}

export function layoutUseLogic(): SingleFileModule {
  return {
    logic() {
      return { num: 1 }
    },
    layout(props: { name: string }) {
      const logic = useLogic<{ num: number }>()
      return (
        <div name={props.name} is-container>
          {logic.num}
        </div>
      )
    }
  }
}

export function useStyleInLayout(): SingleFileModule {
  return {
    logic() {
      return { num: 1 }
    },
    layout(props: { name: string }) {
      const logic = useLogic<{ num: number }>()
      return (
        <div name={props.name}>
          <span>{logic.num}</span>
        </div>
      )
    },
    styleRules(props: { name: string }) {
      const root = useLayout()
      return [
        {
          target: root.div,
          style: {
            color: 'red'
          }
        }
      ]
    }
  }
}

export function useOtherModule(): SingleFileModule {
  return {
    logic() {
      return { num: 1 }
    },
    layout() {
      const logic = useLogic<{ num: number }>()
      const M2 = useModule(layoutUseLogic())
      return (
        <div>
          <span>{logic.num}</span>

          {M2({ name: 'm2' })}
        </div>
      )
    },
    styleRules() {
      const root = useLayout()
      return [
        {
          target: root.div,
          style: {
            color: 'red'
          }
        }
      ]
    }
  }
}
export function useOtherComponentModule(): SingleFileModule {
  return {
    logic() {
      return { num: 1 }
    },
    layout() {
      const logic = useLogic<{ num: number }>()
      const M2 = useModule(layoutUseLogic())
      return (
        <div>
          <span>{logic.num}</span>

          {M2({ name: 'm2' })}

          {/* <M2 name="m2" /> */}
        </div>
      )
    },
    styleRules() {
      const root = useLayout()
      return [
        {
          target: root.div,
          style: {
            color: 'red'
          }
        }
      ]
    }
  }
}

export function hasInputInLayout(): SingleFileModule {
  return {
    logic() {
      const num = signal(0)
      return { num }
    },
    layout() {
      const logic = useLogic<{ num: number }>()
      return (
        <div>
          <input value={logic.num} />
        </div>
      )
    }
  }
}

export function patternHasMultiMatchers(): SingleFileModule {
  return {
    layout() {
      return <div is-container>i am container</div>
    },
    designPattern(props: { v1: boolean; v2: boolean }) {
      const p = matchPatternMatrix([props.v1, props.v2])({
        container: {
          backgroundColor: {
            red: [true, false],
            green: [
              [false, true],
              [true, true]
            ]
          }
        }
      })
      return p
    }
  }
}

export function patternHasMultiMatchers2(): SingleFileModule {
  return {
    layout() {
      return <div is-container>i am container</div>
    },
    designPattern(props: { v1: boolean }) {
      const p = matchPatternMatrix([props.v1, false, false, false])({
        container: {
          backgroundColor: {
            red: [],
            green: [
              [true, '*', '*', false],
              ['*', '*', true, false]
            ]
          }
        }
      })
      return p
    }
  }
}

const MyCpt = createComponent((p: { value: string }) => {
  return <span>value is {p.value}</span>
})

export function insideVNodeComponent() {
  return {
    layout() {
      return (
        <div>
          <MyCpt value="123" />
        </div>
      )
    }
  }
}

export interface LayoutHasTypesStruct {
  type: 'div',
  children: [
    {
      type: 'div',
    }
  ]
} 
export function layoutHasTypes () {
  return {
    layout() {
      return (
        <div>
          <div>123</div>
        </div>
      )
    },
    cssRules (): StyleRule[] {
      const root = useLayout<LayoutHasTypesStruct>()
      
      return [
        {
          target: root.div,
          condition: true,
          style: {
            color: 'red'
          }
        }
      ]
    }
  }
}
