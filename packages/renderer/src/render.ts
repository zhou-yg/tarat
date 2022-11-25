import {
  ModuleRenderContainer,
  OverrideModule,
  RenderHost,
  SingleFileModule,
  VirtualLayoutJSON
} from './types'

import { createReactContainer } from './frameworks/react'
import { last, mergeOverrideModules } from './utils'

let globalCurrentRenderer: Renderer[] = []

function getCurrentRenderer() {
  return last(globalCurrentRenderer)
}
function pushCurrentRenderer(renderer: Renderer) {
  globalCurrentRenderer.push(renderer)
}
function popCurrentRenderer() {
  globalCurrentRenderer.pop()
}

class Renderer {
  mounted: boolean = false

  renderHooksContainer: ModuleRenderContainer = null

  layoutJSON: VirtualLayoutJSON

  constructor(
    public module: SingleFileModule,
    public renderHost: RenderHost,
    public override?: OverrideModule
  ) {
    this.createHooksContainer()
  }

  createHooksContainer() {
    const { framework } = this.renderHost
    switch (framework.name) {
      case 'react':
        {
          this.renderHooksContainer = createReactContainer(
            framework.lib,
            this.module
          )
        }
        break
    }
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

export function createRenderer(
  module: SingleFileModule,
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

export function h(
  tag: string | Function,
  props: Record<string, any> | null,
  ...children: VirtualLayoutJSON[]
) {
  return {
    id: idIndex++,
    tag,
    props: props || {},
    children:
      children.length === 0
        ? undefined
        : children.length === 1
        ? children[0]
        : children
  }
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

export function useModule<T extends Record<string, any>>(
  module: SingleFileModule,
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
    return subModuleRenderer.construct(rest, override)
  }
}
export function useComponentModule<T extends Record<string, any>>(
  module: SingleFileModule,
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

export function useLayout() {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useLayout must be called in render function')
  }
  return renderer.renderHooksContainer.getLayout()
}
