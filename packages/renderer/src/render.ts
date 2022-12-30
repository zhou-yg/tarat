import {
  ModuleRenderContainer,
  NormalizeProps,
  OverrideModule,
  RenderContainer,
  RenderHost,
  SignalProps,
  SingleFileModule,
  StateManagementConfig,
  VirtualLayoutJSON,
  VNodeComponent,
  VNodeComponent2
} from './types'

import { signal } from 'atomic-signal'

import {
  assignDefaultValueByPropTypes,
  isVNodeComponent,
  last,
  VirtualNodeTypeSymbol,
  VNodeComponentSymbol
} from './utils'

import * as reactSignalManagement from './extensions/stateManagements/react-signal'
import * as reactRenderContainer from './extensions/frameworks/react'

import {
  BaseDataType,
  FormatPatchCommands,
  LayoutStructTree,
  MergedPatchCommandsToModule,
  PatchCommand
} from './types-layout'

interface GlobalCurrentRenderer {
  renderHooksContainer: ModuleRenderContainer<any, any, any, any, any>
  config: any // TODO
}

let globalCurrentRenderer: GlobalCurrentRenderer[] = []

function getCurrentRenderer() {
  return last(globalCurrentRenderer)
}
function pushCurrentRenderer(renderer: GlobalCurrentRenderer) {
  globalCurrentRenderer.push(renderer)
}
function popCurrentRenderer() {
  globalCurrentRenderer.pop()
}

/**
 * for React-Signal case
 */
export function createRenderer<
  P extends Record<string, any>,
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
  NewPC
>(
  module: SingleFileModule<P, L, PCArr>,
  renderHost: RenderHost,
  override?: OverrideModule<
    P,
    SingleFileModule<P, L, PCArr>['layoutStruct'],
    NewPC
  >
) {
  const renderer = createRenderer2<P, L, PCArr, NewPC, NormalizeProps<P>>({
    module,
    renderHost,
    override,
    stateManagement: reactSignalManagement.config,
    renderContainerCreator: reactRenderContainer.createReactContainer // @TODO1
  })

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

// export function h2<
//   T extends string | Function,
//   CT1 extends string | Function = undefined,
//   CT2 extends string | Function = undefined,
//   CT3 extends string | Function = undefined,
//   C11 extends string | Function = undefined,
//   C12 extends string | Function = undefined,
//   C13 extends string | Function = undefined,
//   C21 extends string | Function = undefined,
//   C22 extends string | Function = undefined,
//   C23 extends string | Function = undefined,
//   C31 extends string | Function = undefined,
//   C32 extends string | Function = undefined,
//   C33 extends string | Function = undefined,
//   CB1 = undefined,
//   CB2 = undefined,
//   CB3 = undefined
// >(
//   type: T,
//   props?: Record<string, any> | null,
//   c1?: VLayoutNode<CT1, C11, C12, C13> | CB1,
//   c2?: VLayoutNode<CT2, C21, C22, C23> | CB2,
//   c3?: VLayoutNode<CT3, C31, C32, C33> | CB3
// ) {
//   if (isVNodeComponent(type)) {
//     const json = (type as any)({
//       ...(props || {})
//     })
//     return json as VLayoutNode<
//       T,
//       CT1,
//       CT2,
//       CT3,
//       C11,
//       C12,
//       C13,
//       C21,
//       C22,
//       C23,
//       C31,
//       C32,
//       C33,
//       CB1,
//       CB2,
//       CB3
//     >
//   }
//   let key: VLayoutNode<string>['key'] = props?.key
//   let children = []
//   if (props?.children) {
//     if (c1) {
//       key = c1
//     }
//     children = props.children
//     delete props.children
//   } else {
//     children = [c1, c2, c3].filter(Boolean)
//   }
//   if (key !== undefined) {
//     props.key = key
//   }

//   const vLayoutNode = {
//     type,
//     flags: VirtualNodeTypeSymbol,
//     props: props || {},
//     children: [c1, c2, c3].filter(Boolean)
//   } as unknown as VLayoutNode<
//     T,
//     CT1,
//     CT2,
//     CT3,
//     C11,
//     C12,
//     C13,
//     C21,
//     C22,
//     C23,
//     C31,
//     C32,
//     C33,
//     CB1,
//     CB2,
//     CB3
//   >

//   return vLayoutNode
// }

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
    children: children.flat() /** @TODO it's danger! */
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
  ConstructProps
>(
  module: SingleFileModule<P, L, PCArr>,
  override?: OverrideModule<
    P,
    SingleFileModule<P, L, PCArr>['layoutStruct'],
    NewPC
  >
) {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useModule must be called in render function')
  }
  const subModuleRenderer = createRenderer2<P, L, PCArr, NewPC, ConstructProps>(
    {
      ...renderer.config,
      module,
      override
    }
  )

  return createComponent(
    <NewConstructPC>(
      props: P & {
        override?: OverrideModule<
          P,
          SingleFileModule<P, L, [...PCArr, NewPC]>['layoutStruct'],
          NewConstructPC
        >
        checkerTypes?: (arg: { l: L; pcArr: PCArr; newPC: NewPC }) => void
      }
    ) => {
      const { override, ...rest } = props
      return subModuleRenderer.construct<NewConstructPC>(
        rest as ConstructProps,
        override
      )
    }
  )
}
export function useComponentModule<
  P extends Record<string, any>,
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
  NewPC,
  ConstructProps
>(
  module: SingleFileModule<P, L, PCArr>,
  override?: OverrideModule<
    P,
    SingleFileModule<P, L, PCArr>['layoutStruct'],
    NewPC
  >
) {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useModule must be called in render function')
  }
  const subModuleRenderer = createRenderer2<P, L, PCArr, NewPC, ConstructProps>(
    {
      ...renderer.config,
      module,
      override
    }
  )

  return <NewConstructPC>(
    props: P & {
      override?: OverrideModule<
        P,
        SingleFileModule<P, L, [...PCArr, NewPC]>['layoutStruct'],
        NewConstructPC
      >
      checkerTypes?: (arg: { l: L; pcArr: PCArr; newPC: NewPC }) => void
    }
  ) => {
    const { override, ...rest } = props
    subModuleRenderer.construct<NewConstructPC>(
      rest as ConstructProps,
      override
    )
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
  NewProps extends Props,
  NewPC
>(
  module: SingleFileModule<Props, L, PCArr>,
  override: () => OverrideModule<
    NewProps,
    SingleFileModule<NewProps, L, PCArr>['layoutStruct'],
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
    NewProps,
    L,
    [...PCArr, FormatPatchCommands<NewPC>]
  >
}
export function overrideModule<
  L extends LayoutStructTree,
  PCArr extends PatchCommand[][],
  Props,
  NewProps extends Props,
  NewPC
>(
  module: SingleFileModule<Props, L, PCArr>,
  override: OverrideModule<
    NewProps,
    SingleFileModule<Props & NewProps, L, PCArr>['layoutStruct'],
    NewPC
  >
) {
  const newOverride = () => {
    const p1 = module.override?.() || []
    const p2 = override
    return [...p1, p2]
  }
  return {
    ...module,
    override: newOverride
  } as unknown as SingleFileModule<
    NewProps,
    L,
    [...PCArr, FormatPatchCommands<NewPC>]
  >

  // {
  //   // "meta" just for typescript type check
  //   meta: SingleFileModule<NewProps, L, [...PCArr, FormatPatchCommands<NewPC>]>['meta']

  //   override: SingleFileModule<NewProps, L, [...PCArr, FormatPatchCommands<NewPC>]>['override']
  // }
}

export function createRenderer2<
  P extends Record<string, any>,
  L extends LayoutStructTree,
  PCArr2 extends PatchCommand[][],
  NewRendererPC, // pc at renderer layer
  ConstructProps
>(config: {
  module: SingleFileModule<P, L, PCArr2>
  renderHost: RenderHost
  override?: OverrideModule<
    P,
    SingleFileModule<P, L, PCArr2>['layoutStruct'],
    NewRendererPC
  >
  renderContainerCreator: RenderContainer<
    P,
    L,
    PCArr2,
    NewRendererPC,
    ConstructProps
  >
  stateManagement: StateManagementConfig
}) {
  const {
    module,
    renderHost,
    override,
    renderContainerCreator,
    stateManagement
  } = config

  const rendererContainer = renderContainerCreator(
    renderHost.framework.lib,
    module,
    stateManagement,
    {
      useEmotion: renderHost.useEmotion
    }
  )

  let layoutJSON: VirtualLayoutJSON = null
  let defaultProps: VirtualLayoutJSON['props'] = null
  function construct<NewConstructPC>(
    props?: ConstructProps,
    secondOverride?: OverrideModule<
      P,
      SingleFileModule<P, L, [...PCArr2, NewRendererPC]>['layoutStruct'],
      NewConstructPC
    >
  ) {
    pushCurrentRenderer(currentRendererInstance)

    if (!defaultProps) {
      defaultProps = assignDefaultValueByPropTypes({}, module.propTypes)
    }

    const mergedOverrides: any = [override, secondOverride].filter(Boolean)

    const newProps = Object.assign({}, defaultProps, props)

    const r = rendererContainer.construct<NewConstructPC>(
      newProps,
      mergedOverrides
    )

    layoutJSON = r

    popCurrentRenderer()

    return r
  }
  function render() {
    if (!layoutJSON) {
      return
    }
    return rendererContainer.render(layoutJSON)
  }

  const currentRendererInstance = {
    renderHooksContainer: rendererContainer,
    construct,
    render,
    config
  }

  return currentRendererInstance
}
