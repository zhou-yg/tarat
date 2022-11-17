import {
  ModuleRenderContainer,
  RenderHost,
  SingleFileModule,
  VirualLayoutJSON
} from './types'

import { createReactContainer } from './frameworks/react'

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
  constructor(public module: SingleFileModule, public renderHost: RenderHost) {
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

  render(props?: any) {
    pushCurrentRenderer(this)
    let r

    if (this.mounted) {
      r = this.update(props)
    } else {
      r = this.mount(props)
    }

    popCurrentRenderer()

    return r
  }

  mount(props?: any) {
    this.mounted = true
    return this.renderHooksContainer.render(props)
  }
  update(props?: any) {
    return this.renderHooksContainer.render(props)
  }
}

export function createRenderer(
  module: SingleFileModule,
  renderHost: RenderHost
) {
  const renderer = new Renderer(module, renderHost)

  return renderer
}

let idIndex = 0

export function clearIdIndex() {
  idIndex = 0
}

export function h(
  tag: string | Function,
  props: Record<string, any> | null,
  children: VirualLayoutJSON[]
) {
  return {
    id: idIndex++,
    tag,
    props: props || {},
    children
  }
}

/**
 * export hooks
 */
export function createLayout(layoutFn: (...args: any[]) => VirualLayoutJSON) {}

export function useLogic<T = any>(...args: any[]): T {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useLogic must be called in render function')
  }
  return renderer.renderHooksContainer.runLogic(...args) as T
}

export function useModule(
  module: SingleFileModule,
  props: Record<string, any>
) {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useModule must be called in render function')
  }
  const subModuleRenderer = createRenderer(module, renderer.renderHost)
  return subModuleRenderer.render(props)
}

export function useLayout () {
  const renderer = getCurrentRenderer()
  if (!renderer) {
    throw new Error('useLayout must be called in render function')
  }
  return renderer.renderHooksContainer.genLayout()
}