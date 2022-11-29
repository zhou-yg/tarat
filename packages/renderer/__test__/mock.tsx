/* @jsxFactory h  */
import {
  h,
  matchPatternMatrix,
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
        <div id={1}>
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
      root.div.props.style = {
        color: 'red'
      }
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
      root.div.props.style = {
        color: 'red'
      }
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
      root.div.props.style = {
        color: 'red'
      }
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
