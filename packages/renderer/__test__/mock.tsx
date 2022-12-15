/* @jsxFactory h  */
import {
  CommandOP,
  ConvertToLayoutTreeDraft,
  createComponent,
  createRenderer,
  extendModule,
  h,
  LayoutStructTree,
  matchPatternMatrix,
  PatchCommand,
  PrintLayoutStructTree,
  PrintObjectLike,
  ShallowCopyArray,
  StyleRule,
  useLayout,
  useLogic,
  useModule
} from '../src/index'
import {
  BaseDataType,
  OverrideModule,
  SingleFileModule,
  VirtualLayoutJSON
} from '../src/types'
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

type UseStyleInLayoutStruct = {
  type: 'div'
  children: [
    {
      type: 'span'
    }
  ]
}

export function useStyleInLayout(): SingleFileModule<
  {},
  UseStyleInLayoutStruct,
  []
> {
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
      const root = useLayout<UseStyleInLayoutStruct>()
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

type UseOtherModule = {
  type: 'div'
  children: [
    {
      type: 'span'
    }
  ]
}

export function useOtherModule(): SingleFileModule<{}, UseOtherModule, []> {
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
      const root = useLayout<UseOtherModule>()
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

type UseOtherComponentModule = {
  type: 'div'
  children: [
    {
      type: 'span'
    }
  ]
}

export function useOtherComponentModule(): SingleFileModule<
  {},
  UseOtherComponentModule,
  []
> {
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
      const root = useLayout<UseOtherComponentModule>()
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
  type: 'div'
  children: [
    {
      type: 'div'
    }
  ]
}

export function layoutHasTypes<T extends { name: string }>(): SingleFileModule<
  { name: string },
  LayoutHasTypesStruct,
  [[]]
> {
  return {
    layout(props: T) {
      return (
        <div>
          <div>{props.name}</div>
        </div>
      )
    },
    styleRules(): StyleRule[] {
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
const baseModule = layoutHasTypes()
// type BaseProps = Parameters<(typeof baseModule['layout'])>['0']
// type BaseLT = ReturnType<(typeof baseModule['layoutTree'])>
// type BaseL = PrintLayoutStructTree<ReturnType<(typeof baseModule['layoutStruct'])>>
// type BaseOverride = ReturnType<(typeof baseModule['override'])>['0']
// type BaseOverrideL = ReturnType<ReturnType<(typeof baseModule['override'])>['0']['patchLayout']>

const newModule2 = extendModule(baseModule, () => ({
  patchLayout(props, jsonDraft) {
    return [
      {
        op: CommandOP.addChild,
        parent: jsonDraft.div,
        child: {
          type: 'p',
          value: '123'
        }
      }
    ] as const
  }
}))

type BaseProp2 = Parameters<typeof newModule2['layout']>['0']
type BaseLT2 = ReturnType<typeof newModule2['layoutTree']>
type BaseLT2D = BaseLT2['div']
type BaseLT2DD = BaseLT2['div']['div']
type BaseLT2DP = BaseLT2['div']['p']
type BaseBaseL = PrintLayoutStructTree<typeof newModule2['_L']>
type BasePC2Arr = PrintLayoutStructTree<typeof newModule2['_pc2Arr']>
type BaseFPC2Arr = PrintLayoutStructTree<typeof newModule2['_fpc2Arr']>
type BaseL2 = PrintLayoutStructTree<
  ReturnType<typeof newModule2['layoutStruct']>
>
type BaseOverride2 = ReturnType<typeof newModule2['override']>
type BaseOverride2I0 = ReturnType<
  ReturnType<typeof newModule2['override']>['0']['patchLayout']
>
type BaseOverride2I1 = ReturnType<
  ReturnType<typeof newModule2['override']>['1']['patchLayout']
>

const _cr = createRenderer(newModule2, {
  framework: MockRectFramework
})

const newModule3 = extendModule(newModule2, () => ({
  patchLayout(props, jsonDraft) {
    return [
      {
        op: CommandOP.addChild,
        parent: jsonDraft.div.div, // { paths: [], condition: true }
        condition: !!props.name,
        child: {
          type: 'text',
          value: 'hello'
        }
      }
    ] as const
  }
}))
type BaseProp3 = Parameters<typeof newModule3['layout']>['0']
type BaseLT3 = typeof newModule3['layoutTree']
type BaseBaseL3 = PrintLayoutStructTree<typeof newModule3['_L']>
type BasePC3Arr = PrintLayoutStructTree<typeof newModule3['_pc2Arr']>
type BaseFPC3Arr = PrintLayoutStructTree<typeof newModule3['_fpc2Arr']>
type BaseL3 = PrintLayoutStructTree<
  ReturnType<typeof newModule3['layoutStruct']>
>
type BaseOverride3 = ReturnType<typeof newModule3['override']>
type BaseOverride3I0 = ReturnType<
  ReturnType<typeof newModule3['override']>['0']['patchLayout']
>
type BaseOverride3I1 = ReturnType<
  ReturnType<typeof newModule3['override']>['1']['patchLayout']
>
type BaseOverride3I2 = ReturnType<
  ReturnType<typeof newModule3['override']>['2']['patchLayout']
>
