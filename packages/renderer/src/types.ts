import type * as CSS from 'csstype'
import type { ProxyLayoutHandler } from './utils'

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

export interface PatternStructure {
  [mainSematic: string]: {
    [propertyKey: string]: string[]
  }
}

export interface SingleFileModule {
  logic?: (...args: any[]) => Record<string, any>
  layout?: (...args: any[]) => VirtualLayoutJSON
  designPattern?: (...args: any[]) => PatternStructure | void
  styleRules?: (...args: any[]) => StyleRule[] | void
}

export interface VirtualLayoutJSON {
  id: number
  tag: string | Function
  props: Record<string, any>
  children: (VirtualLayoutJSON | BaseDataType)[] | BaseDataType | VirtualLayoutJSON
}

export interface RenderHost {
  framework: {
    name: string
    lib: any
  }
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

export interface ModuleRenderContainer {
  runLogic: (...args: any[]) => Record<string, any>
  render: (props?: any, override?: OverrideModule) => FrameworkVirtualNode
  genLayout: (props?: any) => JSONObjectTree
}

export interface OverrideModule {
  layout?: (jsonTree: JSONObjectTree) => void
}
