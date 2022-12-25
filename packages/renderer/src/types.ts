import type * as CSS from 'csstype'
import type { ProxyLayoutHandler } from './utils'
import type { StateSignal } from 'atomic-signal'
import {
  LayoutStructTree,
  PatchCommand,
  PrintLayoutStructTree,
  ConvertToLayoutTreeDraft,
  ShallowCopyArray,
  FormatPatchCommands,
  PatchLayout,
  PatchLayoutWithCommands,
  FlatPatchCommandsArr,
  BaseDataType,
  Assign
} from './types-layout'

// const root = {
//   div: {
//     span: {

//     }
//   },
//   props: {

//   }
// }
export type LayoutTreeDraft = {
  [key: string]: LayoutTreeDraft | any
}
export type LayoutTreeProxyDraft = {
  [key: string]: LayoutTreeProxyDraft | any
}

export interface StyleRule {
  target: ProxyLayoutHandler['draft']
  condition?: boolean
  style: CSS.Properties
}

export interface PatternStructureResult {
  [propertyKey: string]: string[]
}

export interface PatternStructure {
  [mainSematic: string]: PatternStructureResult
}

export type PC2ArrToOverrideModule<
  Props extends VirtualLayoutJSON['props'],
  L extends LayoutStructTree,
  PC2Arr
> = PC2Arr extends readonly [infer F, ...infer R]
  ? [OverrideModule<Props, L, F>, ...PC2ArrToOverrideModule<Props, L, R>]
  : PC2Arr

export interface PropTypeValidator {
  (...args: any[]): any
}

export interface SingleFileModule<
  Props extends VirtualLayoutJSON['props'],
  L extends LayoutStructTree,
  PC2Arr
> {
  meta?: {
    props: Props
    layoutStruct: L
    patchCommands: PC2Arr
  }
  layoutTree?: () => ConvertToLayoutTreeDraft<
    PatchLayoutWithCommands<L, FlatPatchCommandsArr<PC2Arr>>
  >
  _layoutDraft?: ConvertToLayoutTreeDraft<
    PatchLayoutWithCommands<L, FlatPatchCommandsArr<PC2Arr>>
  >
  _p?: Props
  _fpc2Arr?: FlatPatchCommandsArr<PC2Arr>
  _pc2Arr?: PC2Arr
  _L?: L
  layoutStruct?: PatchLayoutWithCommands<L, FlatPatchCommandsArr<PC2Arr>>
  logic?: (...args: any[]) => Record<string, any>
  layout?: (p?: Props) => VirtualLayoutJSON
  designPattern?: (
    p?: Props,
    rootDraft?: ConvertToLayoutTreeDraft<
      PatchLayoutWithCommands<L, FlatPatchCommandsArr<PC2Arr>>
    >
  ) => PatternStructure | void
  styleRules?: (
    p?: Props,
    rootDraft?: ConvertToLayoutTreeDraft<
      PatchLayoutWithCommands<L, FlatPatchCommandsArr<PC2Arr>>
    >
  ) => StyleRule[] | void
  propTypes?: Record<string, PropTypeValidator>
  config?: (...args: any[]) => ModuleConfig
  override?: () => PC2ArrToOverrideModule<Props, L, PC2Arr>
}

export interface VirtualLayoutJSON extends LayoutStructTree {
  key?: any
  flags: symbol | string
  props: Record<string, any>
  children?: (VirtualLayoutJSON | BaseDataType)[]
}

export interface RenderHost {
  framework: {
    name: string
    lib: any
  }
  stateManagement?: {
    name: string // default is 'signal'
    lib: any
  }
  useEmotion?: boolean
  // frameworkAPI?: {
  //   createElement: (
  //     tag: string | Function,
  //     props: Record<string, any>,
  //     children: VirtualLayoutJSON[]
  //   ) => any
  //   createFragment: (children: VirtualLayoutJSON[]) => any
  // }
}

type FrameworkVirtualNode = any

export interface ModuleConfig {
  // default is 'signal'
  logicLib?: {
    name: string
  }
}

export interface ModuleRenderContainer<
  Props extends VirtualLayoutJSON['props'],
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
  NewRenderPC,
  ConstructProps
> {
  runLogic: (...args: any[]) => Record<string, any>
  render: (json: VirtualLayoutJSON) => FrameworkVirtualNode
  construct: <NewConstructPC>(
    props?: ConstructProps,
    overrides?: [
      OverrideModule<
        Props,
        SingleFileModule<Props, L, [...PCArr, NewRenderPC]>['layoutStruct'],
        NewRenderPC
      >,
      OverrideModule<
        Props,
        SingleFileModule<
          Props,
          L,
          [...PCArr, NewRenderPC, NewConstructPC]
        >['layoutStruct'],
        NewConstructPC
      >
    ]
  ) => VirtualLayoutJSON
  getLayout: <L extends LayoutStructTree>(
    props?: Props
  ) => ConvertToLayoutTreeDraft<L>
}

export interface OverrideModule<
  Props extends VirtualLayoutJSON['props'] = unknown,
  L extends LayoutStructTree = any,
  PC = []
> {
  layout?: (props: Props, layout: LayoutTreeProxyDraft) => void
  patchLayout?: (
    props: Props,
    layout: ConvertToLayoutTreeDraft<L>,
    types?: { l: L; pc: PC }
  ) => PC
}

type Func = (...args: any[]) => any

export interface StateManagementMatch {
  renderFramework: string
  stateManagement: string
}

export interface StateManagementConfig {
  matches: StateManagementMatch[]
  runLogic: <T extends Func>(
    react: any,
    hook: T,
    args: Parameters<T>
  ) => ReturnType<T>
  transform?: (json: VirtualLayoutJSON) => VirtualLayoutJSON
  covertProps?: (
    props: any,
    propTypes?: Record<string, PropTypeValidator>
  ) => any
}

export type RenderContainer<
  P extends Record<string, any>,
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
  NewPC,
  ConstructProps
> = (
  framework: any,
  module: SingleFileModule<P, L, PCArr>,
  stateManagement: StateManagementConfig,
  options?: { useEmotion: boolean }
) => ModuleRenderContainer<P, L, PCArr, NewPC, ConstructProps>

export type SignalProps<T extends Record<string, any>> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? T[P]
    : StateSignal<T[P]>
}

export type NormalizeProps<T extends Object> = {
  [K in keyof T]: T[K] extends StateSignal<infer T2> ? T2 : T[K]
}

export type VNodeComponent = (
  props?: VirtualLayoutJSON['props']
) => VirtualLayoutJSON & {}

export type VNodeComponent2 = (...args: any[]) => any
