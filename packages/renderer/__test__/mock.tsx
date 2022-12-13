/* @jsxFactory h  */
import {
  createComponent,
  extendModule,
  h,
  LayoutStructTree,
  matchPatternMatrix,
  PatchCommand,
  PrintLayoutStructTree,
  PrintObjectLike,
  StyleRule,
  TransformToLayoutTreeDraft,
  useLayout,
  useLogic,
  useModule
} from '../src/index'
import { BaseDataType, OverrideModule, SingleFileModule, VirtualLayoutJSON } from '../src/types'
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

export function simpleModule(): SingleFileModule<{}, any, []> {
  return {
    logic() {
      return {}
    },
    layout() {
      return <div></div>
    }
  }
}

export function moduleHasMultipleChild(): SingleFileModule<{}, any, []> {
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

export function layoutUseLogic(): SingleFileModule<{ name: string }, any, []> {
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

export function useStyleInLayout(): SingleFileModule<{}, any, []> {
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

export function useOtherModule(): SingleFileModule<{}, any, []> {
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
export function useOtherComponentModule(): SingleFileModule<{}, any, []> {
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

export function hasInputInLayout(): SingleFileModule<{}, any, []> {
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

export function patternHasMultiMatchers(): SingleFileModule<{}, any, []> {
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

export function patternHasMultiMatchers2(): SingleFileModule<{}, any, []> {
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

// for extend module

export interface LayoutHasTypesStruct {
  type: 'div',
  children: [
    {
      type: 'div',
    }
  ]
}

type vv1 = { op: "addChild"; parent: string[]; child: { type: string; value: string; }; }

type vvr = PatchCommand['child'] extends vv1['child']  ? 1 : 2
type vvrO = PatchCommand['op'] extends vv1['op']  ? 1 : 2
type vvr2 = vv1 extends PatchCommand ? 1 : 2

function bb () {
  return {
    a: 1
  }
}

export function layoutHasTypes<
T extends { name: string }, 
L extends LayoutHasTypesStruct, 
> (): SingleFileModule<T, L, []> {
  return {
    layout(props: T) {
      return (
        <div>
          <div>{props.name}</div>
        </div>
      )
    },
    styleRules (): StyleRule[] {
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
    },
  }
}
const baseModule = layoutHasTypes()
type BaseProps = Parameters<(typeof baseModule['layout'])>['0']
type BaseL = PrintLayoutStructTree<(typeof baseModule['layoutTree'])>
type BaseOverride = ReturnType<ReturnType<(typeof baseModule['override'])>['patchLayout']>

const newModule2 = extendModule(baseModule, () => ({
  patchLayout (props, jsonDraft) {
    return [
      {
        op: 'addChild',
        parent: jsonDraft.div.div as unknown as readonly ['div', 'div'],
        child: {
          type: 'p',
          value: '123'
        }
      }
    ] as const
  }
}))

type BaseProp2 = Parameters<typeof newModule2['layout']>['0']
type BaseL2 = PrintLayoutStructTree<typeof newModule2['layoutTree']>
type BaseOverride2 = ReturnType<typeof newModule2['override']>
type BaseOverridePatchResult2 = ReturnType<ReturnType<typeof newModule2['override']>['patchLayout']>

const newModule3 = extendModule(newModule2, () => ({
  patchLayout (props, jsonDraft) {
    return [
      {
        op: 'removeChild',
        parent: jsonDraft.div.div as unknown as readonly ['div', 'div'],
        child: {
          type: 'text',
          value: 'hello'
        }
      }
    ] as const
  }
}))
type BaseProp3 = Parameters<typeof newModule3['layout']>['0']
type BaseL3 = PrintLayoutStructTree<typeof newModule3['layoutTree']>
type BaseOverride3 = ReturnType<typeof newModule3['override']>['patchLayout']
type BaseOverridePatchResult3 = PrintObjectLike<ReturnType<BaseOverride3>>
type BaseOverridePatchResult30 = ReturnType<ReturnType<typeof newModule3['override']>['patchLayout']>['0']
type BaseOverridePatchResult31 = ReturnType<ReturnType<typeof newModule3['override']>['patchLayout']>['1']


// type ExtendTypesModule2 = Patch<LayoutHasTypesStruct, typeof newModule>

export function extendTypesModule () {
  return {
    
  }
}
