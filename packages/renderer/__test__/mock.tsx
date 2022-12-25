/* @jsxFactory h  */
import {
  BaseDataType,
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
  useModule,
  OverrideModule,
  SingleFileModule,
  VirtualLayoutJSON,
  PatchLayoutWithCommands,
  FlatPatchCommandsArr,
  Assign,
  overrideModule,
  SignalProps,
  PropTypes
} from '../src/index'
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

export function layoutUseLogic(): SingleFileModule<
  SignalProps<{ name: string }>,
  any,
  []
> {
  return {
    propTypes: {
      name: PropTypes.signal.isRequired
    },
    logic() {
      return { num: 1 }
    },
    layout(props) {
      const logic = useLogic<{ num: number }>()
      return (
        <div name={props.name()} is-container>
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
  SignalProps<{ name: string }>,
  UseStyleInLayoutStruct,
  []
> {
  return {
    propTypes: {
      name: PropTypes.signal.isRequired
    },
    logic() {
      return { num: 1 }
    },
    layout(props) {
      const logic = useLogic<{ num: number }>()
      return (
        <div name={props.name()}>
          <span>{logic.num}</span>
        </div>
      )
    },
    styleRules(props) {
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

export function useOtherModule(): SingleFileModule<
  SignalProps<{ name: string }>,
  UseOtherModule,
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

          {M2({ name: signal('m2') })}
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

          {M2({ name: signal('m2') })}

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

export function patternHasMultiMatchers(): SingleFileModule<
  SignalProps<{ v1: boolean; v2: boolean }>,
  any,
  []
> {
  return {
    propTypes: {
      v1: PropTypes.signal.isRequired,
      v2: PropTypes.signal.isRequired
    },
    layout() {
      return <div is-container>i am container</div>
    },
    designPattern(props) {
      const p = matchPatternMatrix([props.v1(), props.v2()])({
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

export function patternHasMultiMatchers2(): SingleFileModule<
  SignalProps<{ v1: boolean }>,
  any,
  []
> {
  return {
    propTypes: {
      v1: PropTypes.signal.isRequired
    },
    layout() {
      return <div is-container>i am container</div>
    },
    designPattern(props) {
      const p = matchPatternMatrix([props.v1(), false, false, false])({
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

export function layoutHasTypes(): SingleFileModule<
  SignalProps<{ name: string }>,
  LayoutHasTypesStruct,
  [[]]
> {
  return {
    propTypes: {
      name: PropTypes.signal.isRequired
    },
    layout(props) {
      return (
        <div>
          <div>{props.name()}</div>
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
type BaseL2 = PrintLayoutStructTree<typeof newModule2['layoutStruct']>
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
type BaseL3 = PrintLayoutStructTree<typeof newModule3['layoutStruct']>
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

interface BaseModuleForOverrideProps {
  text: string
}
interface BaseModuleForOverrideLayoutStruct {
  type: 'div'
  children: [string]
}
function BaseModuleForOverride(): SingleFileModule<
  SignalProps<BaseModuleForOverrideProps>,
  BaseModuleForOverrideLayoutStruct,
  []
> {
  return {
    propTypes: {
      text: PropTypes.signal.isRequired
    },
    layout(props) {
      return <div is-container>i am {props.text()}</div>
    },
    styleRules(props, root) {
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

export function useSingleOverride() {
  const base = BaseModuleForOverride()
  const singleOverride = overrideModule(base, {
    patchLayout(
      props: SignalProps<BaseModuleForOverrideProps> & { show?: boolean },
      jsonDraft
    ) {
      return [
        {
          op: CommandOP.addChild,
          condition: props.show,
          parent: jsonDraft.div,
          child: (<span is-text>text</span>) as { type: 'span' } // must type p
        }
      ] as const
    }
  })

  const m2 = singleOverride

  const m3 = extendModule(m2, () => ({
    patchLayout(props, root) {
      return [
        {
          op: CommandOP.addChild,
          parent: root.div.span,
          child: (<text></text>) as { type: 'text' } // must type p
        }
      ] as const
    }
  }))
  const m4 = extendModule(m3, () => ({
    patchLayout(props, root) {
      /** root expect ot be below
       * (parameter) root: {
            div: readonly ["div"] & {
                span: readonly ["div", "span"] & {
                    span: readonly ["div", "span", "span"];
                };
            };
        }
       */
    }
  }))

  return m2
}

export function overrideAtModuleLayer() {
  const m2 = extendModule(BaseModuleForOverride(), () => ({
    patchLayout(props, jsonDraft) {
      return [
        {
          op: CommandOP.addChild,
          parent: jsonDraft.div,
          child: (<p></p>) as { type: 'p' } // must type p
        }
      ] as const
    }
  }))
  const m3 = extendModule(m2, () => ({
    patchLayout(props, jsonDraft) {
      return [
        {
          op: CommandOP.addChild,
          parent: jsonDraft.div.p,
          child: <p></p>
        }
      ] as const
    }
  }))

  return m2
}

export function overrideAtUseModule(): SingleFileModule<
  SignalProps<{ m2Text: string }>,
  { type: 'div' },
  []
> {
  const m2 = overrideAtModuleLayer()

  type pc2Arr = typeof m2['_pc2Arr']

  return {
    layout(props) {
      const UsedM2 = useModule(m2, {
        patchLayout(props, jsonDraft) {
          return [
            {
              op: CommandOP.addChild,
              parent: jsonDraft.div.p,
              child: <text>{123}</text>
            }
          ]
        }
      })

      return (
        <usingModule className="at-module">
          <UsedM2 text={props.m2Text}></UsedM2>
        </usingModule>
      )
    }
  }
}

export function overrideAtUseModuleAndRender(): SingleFileModule<
  SignalProps<{ m2Text: string }>,
  { type: 'div' },
  []
> {
  const m2 = overrideAtModuleLayer()

  type pc2Arr = typeof m2['_pc2Arr']

  return {
    layout(props) {
      const UsedM2 = useModule(m2, {
        patchLayout(props, jsonDraft) {
          return [
            {
              op: CommandOP.addChild,
              parent: jsonDraft.div.p,
              child: (<text>123</text>) as unknown as {
                readonly type: 'text'
                readonly children: readonly ['123']
              }
            }
          ] as const
        }
      })

      return (
        <usingModule className="at-module">
          <UsedM2
            text={props.m2Text}
            checkerTypes={({ l, pcArr, newPC }) => {
              type L = typeof l
              type LDisplay = PrintLayoutStructTree<L>
              type PCArr = typeof pcArr
              type PC = typeof newPC
              type FPC = FlatPatchCommandsArr<[...PCArr, PC]>
              type NewL = PatchLayoutWithCommands<L, FPC>
              type NewLDisplay = PrintLayoutStructTree<NewL>
              type NewD = ConvertToLayoutTreeDraft<
                PatchLayoutWithCommands<L, FPC>
              >
            }}
            override={{
              patchLayout(props, jsonDraft, types) {
                type Draft = typeof jsonDraft
                type Types = PrintLayoutStructTree<typeof types.l>
                type Types2 = typeof types
                return [
                  {
                    op: CommandOP.addChild,
                    parent: jsonDraft.div.p.text,
                    child: <label>{456}</label>
                  }
                ]
              }
            }}
          ></UsedM2>
        </usingModule>
      )
    }
  }
}
