import {
  ModuleRenderContainer,
  OverrideModule,
  RenderHost,
  SingleFileModule,
  VirtualLayoutJSON
} from './types'

import { createReactContainer } from './frameworks/react'
import { mergeOverrideModules } from './utils'

let globalCurrentRenderer: Renderer | null = null

function getCurrentRenderer() {
  return globalCurrentRenderer
}
function pushCurrentRenderer(renderer: Renderer) {
  globalCurrentRenderer = renderer
}
function popCurrentRenderer() {
  globalCurrentRenderer = null
}

class Renderer {
  mounted: boolean = false

  renderHooksContainer: ModuleRenderContainer = null
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

  render(props?: any, override?: OverrideModule) {
    pushCurrentRenderer(this)
    let r

    if (this.mounted) {
      r = this.update(props, override)
    } else {
      r = this.mount(props, override)
    }

    popCurrentRenderer()

    return r
  }

  mount(props?: any, override?: OverrideModule) {
    this.mounted = true
    const mergedOverride = mergeOverrideModules([this.override, override])
    return this.renderHooksContainer.render(props, mergedOverride)
  }
  update(props?: any, override?: OverrideModule) {
    const mergedOverride = mergeOverrideModules([this.override, override])
    return this.renderHooksContainer.render(props, mergedOverride)
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

export function useModule<T extends Record<string, any>>(module: SingleFileModule, override?: OverrideModule) {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useModule must be called in render function')
  }
  const subModuleRenderer = createRenderer(module, renderer.renderHost, override)

  return (
    props: T & { className?: string },
    override?: OverrideModule
  ) => {
    return subModuleRenderer.render(props, override)
  }
}

export function useLayout() {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useLayout must be called in render function')
  }
  return renderer.renderHooksContainer.genLayout()
}
