type BaseDataType = string | number | boolean | null | undefined

export interface SingleFileModule {
  logic?: (...args: any[]) => Record<string, any>
  layout?: (...args: any[]) => VirualLayoutJSON
  designPatthern?: (...args: any[]) => void
  style?: (...args: any[]) => void
}

export interface VirualLayoutJSON {
  id: number
  tag: string | Function
  props: Record<string, any>
  children: VirualLayoutJSON[] | BaseDataType
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
  //     children: VirualLayoutJSON[]
  //   ) => any
  //   createFragment: (children: VirualLayoutJSON[]) => any
  // }
}

type FrameworkVirtualNode = any

export interface ModuleRenderContainer {
  useLogic: (...args: any[]) => Record<string, any>
  render: (props?: any) => FrameworkVirtualNode
}
