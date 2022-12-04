import type * as CSS from 'csstype'
import type { ExtensionCore } from './extension'
import type { ProxyLayoutHandler } from './utils'
import type { StateSignal } from 'atomic-signal'

export type BaseDataType = string | number | boolean | null | undefined

// const root = {
//   div: {
//     span: {

//     }
//   },
//   props: {

//   }
// }
export type JSONObjectTree = {
  [key: string]: JSONObjectTree | any
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
  Props extends VirtualLayoutJSON['props'] = any
> {
  logic?: (...args: any[]) => Record<string, any>
  layout?: (p?: Props) => VirtualLayoutJSON
  designPattern?: (p?: Props) => PatternStructure | void
  styleRules?: (p?: Props) => StyleRule[] | void
  config?: (...args: any[]) => ModuleConfig<Props>
}

export interface VirtualLayoutJSON {
  id: number
  key?: any
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

export interface ModuleConfig<Props extends VirtualLayoutJSON['props']> {
  // default is 'signal'
  logicLib?: {
    name: string
  }
  overrides?: OverrideModule<Props>[]
}

export interface ModuleRenderContainer<
  Props extends VirtualLayoutJSON['props'] = any
> {
  runLogic: (...args: any[]) => Record<string, any>
  render: (json: VirtualLayoutJSON) => FrameworkVirtualNode
  construct: (
    props?: Props,
    override?: OverrideModule<Props>
  ) => VirtualLayoutJSON
  getLayout: (props?: Props) => JSONObjectTree
}

export interface OverrideModule<
  Props extends VirtualLayoutJSON['props'] = any
> {
  layout?: (props: Props, jsonTree: JSONObjectTree) => void
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

export interface RenderContainer {
  (
    framework: any,
    module: SingleFileModule,
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
