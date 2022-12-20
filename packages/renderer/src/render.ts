import {
  ModuleRenderContainer,
  OverrideModule,
  RenderHost,
  SingleFileModule,
  VirtualLayoutJSON,
  VNodeComponent,
  VNodeComponent2
} from './types'

import {
  isVNodeComponent,
  last,
  VirtualNodeTypeSymbol,
  VNodeComponentSymbol
} from './utils'
import { extensionCore } from './extension'
import {
  BaseDataType,
  FormatPatchCommands,
  LayoutStructTree,
  MergedPatchCommandsToModule,
  PatchCommand,
  VLayoutNode
} from './types-layout'

let globalCurrentRenderer: Renderer<any, any, any, any>[] = []

function getCurrentRenderer() {
  return last(globalCurrentRenderer)
}
function pushCurrentRenderer(renderer: Renderer<any, any, any, any>) {
  globalCurrentRenderer.push(renderer)
}
function popCurrentRenderer() {
  globalCurrentRenderer.pop()
}

class Renderer<
  P extends Record<string, any>,
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
  NewRendererPC, // pc at renderer layer
> {
  mounted: boolean = false

  renderHooksContainer: ModuleRenderContainer<P, L, PCArr, NewRendererPC> = null

  layoutJSON: VirtualLayoutJSON

  constructor(
    public module: SingleFileModule<P, L, PCArr>,
    public renderHost: RenderHost,
    public override?: OverrideModule<P, ReturnType<SingleFileModule<P, L, PCArr>['layoutStruct']>, NewRendererPC>
  ) {
    this.createHooksContainer()
  }

  createHooksContainer() {
    const { framework } = this.renderHost

    const containerCreator = extensionCore.getContainerCreator(framework.name)

    this.renderHooksContainer = containerCreator(
      framework.lib,
      this.module,
      extensionCore,
      {
        useEmotion: this.renderHost.useEmotion
      }
    )
  }

  render() {
    if (!this.layoutJSON) {
      return
    }
    return this.renderHooksContainer.render(this.layoutJSON)
  }

  construct<NewConstructPC>(
    props?: P,
    override?: OverrideModule<P, ReturnType<SingleFileModule<P, L, [...PCArr, NewRendererPC]>['layoutStruct']>, NewConstructPC>
  ) {
    pushCurrentRenderer(this)

    let r = this.mount<NewConstructPC>(props, override)
    this.layoutJSON = r

    popCurrentRenderer()

    return r
  }

  mount<NewConstructPC>(
    props?: P,
    override?: OverrideModule<P, ReturnType<SingleFileModule<P, L, [...PCArr, NewRendererPC]>['layoutStruct']>, NewConstructPC>
  ) {
    this.mounted = true
    const mergedOverrides: any = [this.override, override].filter(Boolean)
    return this.renderHooksContainer.construct<NewConstructPC>(
      props,
      mergedOverrides
    )
  }
}

export function createRenderer<
  P extends Record<string, any>,
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
  NewPC
>(
  module: SingleFileModule<P, L, PCArr>,
  renderHost: RenderHost,
  override?: OverrideModule<P, ReturnType<SingleFileModule<P, L, PCArr>['layoutStruct']>, NewPC>
) {
  const renderer = new Renderer(module, renderHost, override)

  return renderer
}

let idIndex = 0

export function clearIdIndex() {
  idIndex = 0
}

export function createComponent<T extends VNodeComponent2>(func: T) {
  function component(...args: Parameters<T>): ReturnType<VNodeComponent> {
    return func.apply(null, args)
  }
  Object.defineProperty(component, 'name', {
    get() {
      return func.name
    }
  })
  component[VNodeComponentSymbol] = true
  Object.keys(func).forEach(key => {
    component[key] = func[key]
  })
  return component
}

export function h2<
  T extends string | Function,
  CT1 extends string | Function = undefined,
  CT2 extends string | Function = undefined,
  CT3 extends string | Function = undefined,
  C11 extends string | Function = undefined,
  C12 extends string | Function = undefined,
  C13 extends string | Function = undefined,
  C21 extends string | Function = undefined,
  C22 extends string | Function = undefined,
  C23 extends string | Function = undefined,
  C31 extends string | Function = undefined,
  C32 extends string | Function = undefined,
  C33 extends string | Function = undefined,
  CB1 = undefined,
  CB2 = undefined,
  CB3 = undefined
>(
  type: T,
  props?: Record<string, any> | null,
  c1?: VLayoutNode<CT1, C11, C12, C13> | CB1,
  c2?: VLayoutNode<CT2, C21, C22, C23> | CB2,
  c3?: VLayoutNode<CT3, C31, C32, C33> | CB3
) {
  if (isVNodeComponent(type)) {
    const json = (type as any)({
      ...(props || {})
    })
    return json as VLayoutNode<
      T,
      CT1,
      CT2,
      CT3,
      C11,
      C12,
      C13,
      C21,
      C22,
      C23,
      C31,
      C32,
      C33,
      CB1,
      CB2,
      CB3
    >
  }
  let key: VLayoutNode<string>['key'] = props?.key
  let children = []
  if (props?.children) {
    if (c1) {
      key = c1
    }
    children = props.children
    delete props.children
  } else {
    children = [c1, c2, c3].filter(Boolean)
  }
  if (key !== undefined) {
    props.key = key
  }

  const vLayoutNode = {
    type,
    flags: VirtualNodeTypeSymbol,
    props: props || {},
    children: [c1, c2, c3].filter(Boolean)
  } as unknown as VLayoutNode<
    T,
    CT1,
    CT2,
    CT3,
    C11,
    C12,
    C13,
    C21,
    C22,
    C23,
    C31,
    C32,
    C33,
    CB1,
    CB2,
    CB3
  >

  return vLayoutNode
}

export function h(
  type: string | Function,
  props: Record<string, any> | null,
  ...children: (VirtualLayoutJSON | BaseDataType)[]
): VirtualLayoutJSON {
  if (isVNodeComponent(type)) {
    const json = (type as any)({
      ...(props || {}),
      children
    })
    return json
  }
  /** compatible with different versions jsx: children in props, and key in children */
  if (props?.children) {
    if (children.length !== 0) {
      props.key = children
    }
    children = props.children
    delete props.children
  }

  const result: VirtualLayoutJSON = {
    // id: idIndex++,
    flags: VirtualNodeTypeSymbol,
    type,
    props: props || {},
    children: children.flat(), /** @TODO it's danger! */
  }

  let key = props?.key
  if (key) {
    result.key = key
  }

  return result
}

/**
 * export hooks
 */
export function createLayout(layoutFn: (...args: any[]) => VirtualLayoutJSON) {}

export function useLogic<T = any>(...args: any[]): T {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useLogic must be called in render function')
  }
  return renderer.renderHooksContainer.runLogic(...args) as T
}

export function useModule<
  P extends Record<string, any>,
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
  NewPC,
>(
  module: SingleFileModule<P, L, PCArr>,
  override?: OverrideModule<P, ReturnType<SingleFileModule<P, L, PCArr>['layoutStruct']>, NewPC>
) {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useModule must be called in render function')
  }
  const subModuleRenderer = createRenderer<P, L, PCArr, NewPC>(
    module,
    renderer.renderHost,
    override
  )

  return createComponent(<NewConstructPC>(
    props: 
      P & 
      { 
        override?: OverrideModule<P, ReturnType<SingleFileModule<P, L, [...PCArr, NewPC]>['layoutStruct']>, NewConstructPC>,
        checkerTypes?: (arg: {
          l: L,
          pcArr: PCArr,
          newPC: NewPC,
        }
        ) => void
      }
  ) => {
    const { override, ...rest } = props
    return subModuleRenderer.construct<NewConstructPC>(rest as P, override)
  })
}
export function useComponentModule<
  P extends Record<string, any>,
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
  NewPC,
>(
  module: SingleFileModule<P, L, PCArr>,
  override?: OverrideModule<P, ReturnType<SingleFileModule<P, L, PCArr>['layoutStruct']>, NewPC>
) {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useModule must be called in render function')
  }
  const subModuleRenderer = createRenderer(
    module,
    renderer.renderHost,
    override
  )

  return (props: P & { override?: OverrideModule }) => {
    const { override, ...rest } = props
    subModuleRenderer.construct(rest as P, override)
    return subModuleRenderer.render()
  }
}

export function useLayout<T extends LayoutStructTree>() {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useLayout must be called in render function')
  }
  return renderer.renderHooksContainer.getLayout<T>()
}

export function extendModule<
  Props,
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
  NewPC
>(
  module: SingleFileModule<Props, L, PCArr>,
  override: () => OverrideModule<
    Props,
    ReturnType<SingleFileModule<Props, L, PCArr>['layoutStruct']>,
    NewPC
  >
) {
  return {
    ...module,
    override() {
      const p1 = module.override?.() || []
      const p2 = override()
      return [...p1, p2]
    }
  } as unknown as SingleFileModule<
    Props,
    L, // ReturnType<SingleFileModule<Props, L, [...PCArr, FormatPatchCommands<NewPC>]>['layoutStruct']>,
    [...PCArr, FormatPatchCommands<NewPC>]
  >
}
export function override<
  Props,
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
  NewPC
>(
  module: SingleFileModule<Props, L, PCArr>,
  override: () => OverrideModule<
    Props,
    ReturnType<SingleFileModule<Props, L, PCArr>['layoutStruct']>,
    NewPC
  >
) {
  const newOverride = () => {
    const p1 = module.override?.() || []
    const p2 = override()
    return [...p1, p2]
  }
  return newOverride as unknown as SingleFileModule<Props, L, [...PCArr, FormatPatchCommands<NewPC>]>['override']
}
