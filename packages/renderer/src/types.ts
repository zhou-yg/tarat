import type * as CSS from 'csstype'
import type { ExtensionCore } from './extension'
import type { ProxyLayoutHandler } from './utils'
import type { StateSignal } from 'atomic-signal'
import { LayoutStructTree, PatchCommand, PrintLayoutStructTree, TransformToLayoutTreeDraft } from './types-layout'

export type BaseDataType = string | number | boolean | null | undefined

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

export interface SingleFileModule<
  Props extends VirtualLayoutJSON['props'],
  L extends LayoutStructTree,
  PC extends readonly PatchCommand[],
> {
  layoutTree?: TransformToLayoutTreeDraft<L>
  logic?: (...args: any[]) => Record<string, any>
  layout?: (p?: Props) => VirtualLayoutJSON
  designPattern?: (p?: Props) => PatternStructure | void
  styleRules?: (p?: Props) => StyleRule[] | void
  config?: (...args: any[]) => ModuleConfig
  override?: () => OverrideModule<Props, L, PC>
}

export interface VirtualLayoutJSON {
  id: number
  key?: any
  flags: symbol | string
  type: string | Function
  props: Record<string, any>
  children:
    | (VirtualLayoutJSON | BaseDataType)[]
    | BaseDataType
    | VirtualLayoutJSON
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
  Props extends VirtualLayoutJSON['props'] = unknown,
  L extends LayoutStructTree = any,
> {
  runLogic: (...args: any[]) => Record<string, any>
  render: (json: VirtualLayoutJSON) => FrameworkVirtualNode
  construct: (
    props?: Props,
    override?: OverrideModule<Props, L>
  ) => VirtualLayoutJSON
  getLayout: <L extends LayoutStructTree>(props?: Props) => TransformToLayoutTreeDraft<L>
}

export interface OverrideModule<
  Props extends VirtualLayoutJSON['props'] = unknown,
  L extends LayoutStructTree = any,
  PC extends readonly PatchCommand[] = []
> {
  layout?: (props: Props, jsonTree: TransformToLayoutTreeDraft<L>) => void
  patchLayout?: (props: Props, jsonTree: TransformToLayoutTreeDraft<L>) => PC
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
  transform: (json: VirtualLayoutJSON) => VirtualLayoutJSON
}

export interface RenderContainer<P extends Record<string, any>, L extends LayoutStructTree, PC extends PatchCommand[]> {
  (
    framework: any,
    module: SingleFileModule<P, L, PC>,
    extensionCore: ExtensionCore,
    options?: { useEmotion: boolean }
  ): ModuleRenderContainer
}

export type SignalProps<T extends Object> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? T[P]
    : StateSignal<T[P]>
}

export type VNodeComponent = (
  props?: VirtualLayoutJSON['props']
) => VirtualLayoutJSON & {}
