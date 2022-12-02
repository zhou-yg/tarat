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

export interface SingleFileModule {
  logic?: (...args: any[]) => Record<string, any>
  layout?: (...args: any[]) => VirtualLayoutJSON
  designPattern?: (...args: any[]) => PatternStructure | void
  styleRules?: (...args: any[]) => StyleRule[] | void
  config?: (...args: any[]) => ModuleConfig
}

export interface VirtualLayoutJSON {
  id: number
  tag: string | Function
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

export interface ModuleRenderContainer {
  runLogic: (...args: any[]) => Record<string, any>
  render: (json: VirtualLayoutJSON) => FrameworkVirtualNode
  construct: (props?: any, override?: OverrideModule) => VirtualLayoutJSON
  getLayout: (props?: any) => JSONObjectTree
}

export interface OverrideModule {
  layout?: (jsonTree: JSONObjectTree) => void
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
