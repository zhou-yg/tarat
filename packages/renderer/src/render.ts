import {
  BaseDataType,
  ModuleRenderContainer,
  OverrideModule,
  RenderHost,
  SingleFileModule,
  StateManagementConfig,
  StateManagementMatch,
  VirtualLayoutJSON,
  VNodeComponent
} from './types'

import {
  isVNodeComponent,
  last,
  mergeOverrideModules,
  VirtualNodeTypeSymbol,
  VNodeComponentSymbol
} from './utils'
import { extensionCore } from './extension'
import { LayoutStructTree, MergedPatchCommandsToModule, PatchCommand } from './types-layout'

let globalCurrentRenderer: Renderer<any, any, any>[] = []

function getCurrentRenderer() {
  return last(globalCurrentRenderer)
}
function pushCurrentRenderer(renderer: Renderer<any, any, any>) {
  globalCurrentRenderer.push(renderer)
}
function popCurrentRenderer() {
  globalCurrentRenderer.pop()
}

class Renderer<P extends Record<string, any>, L extends LayoutStructTree, PC extends PatchCommand[]> {
  mounted: boolean = false

  renderHooksContainer: ModuleRenderContainer = null

  layoutJSON: VirtualLayoutJSON

  constructor(
    public module: SingleFileModule<P, L, PC>,
    public renderHost: RenderHost,
    public override?: OverrideModule
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

  construct(props?: any, override?: OverrideModule) {
    pushCurrentRenderer(this)

    let r = this.mount(props, override)
    this.layoutJSON = r

    popCurrentRenderer()

    return r
  }

  mount(props?: any, override?: OverrideModule) {
    this.mounted = true
    const mergedOverride = mergeOverrideModules([this.override, override])
    return this.renderHooksContainer.construct(props, mergedOverride)
  }
}

export function createRenderer<P extends Record<string, any>, L extends LayoutStructTree, PC extends PatchCommand[]>(
  module: SingleFileModule<P, L, PC>,
  renderHost: RenderHost,
  override?: OverrideModule
) {
  const renderer = new Renderer(module, renderHost, override)

  return renderer
}

let idIndex = 0

export function clearIdIndex() {
  idIndex = 0
}
export function createComponent<T extends VNodeComponent>(func: T) {
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
export function h(
  type: string | Function,
  props: Record<string, any> | null,
  ...children: (VirtualLayoutJSON | BaseDataType)[]
) {
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
    id: idIndex++,
    flags: VirtualNodeTypeSymbol,
    type,
    props: props || {},
    children:
      children.length === 0
        ? undefined
        : children.length === 1
        ? children[0]
        : children
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

export function useModule<P extends Record<string, any>, L extends LayoutStructTree, PC extends PatchCommand[]>(
  module: SingleFileModule<P, L, PC>,
  override?: OverrideModule
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

  return createComponent((props: P & { override?: OverrideModule }) => {
    const { override, ...rest } = props
    return subModuleRenderer.construct(rest, override)
  })
}
export function useComponentModule<T extends Record<string, any>, L extends LayoutStructTree, PC extends PatchCommand[]>(
  module: SingleFileModule<T, L, PC>,
  override?: OverrideModule
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

  return (props: T & { override?: OverrideModule }) => {
    const { override, ...rest } = props
    subModuleRenderer.construct(rest, override)
    return subModuleRenderer.render()
  }
}

export function useLayout<T extends LayoutStructTree = any>() {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useLayout must be called in render function')
  }
  return renderer.renderHooksContainer.getLayout<T>()
}

export function extendModule<
  Props,
  L extends LayoutStructTree,
  PC extends readonly any[],
  NewPC extends readonly any[]
>(
  module: SingleFileModule<Props, L, PC>,
  override: () => OverrideModule<Props, L, NewPC>
): SingleFileModule<
  Props,
  L,
  readonly[...PC, ...NewPC]
> {
  return {
    ...module,
    override () {
      const p1 = (module.override?.() || {})
      const p2 = override()
      return {
        patchLayout (...rest) {
          const r1 = p1.patchLayout?.(...rest)
          const r2 = p2.patchLayout?.(...rest)
          return [].concat(r1).concat(r2) as any
        }
      } as MergedPatchCommandsToModule<Props, L, PC, NewPC>
    }
  }
}
