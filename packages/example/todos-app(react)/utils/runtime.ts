import { IHookContext, setHookAdaptor, setModelConfig } from '@tarot-run/core'

import React, { createElement } from 'react'
import { createRoot } from 'react-dom/client'

setHookAdaptor(React, 'react')

const hostConfig = `/${(window as any).tarotConfig.apiPre}`

/**
 * @TODO should provide by @tarot-run by default
 */
setModelConfig({
  async find(e, w) {
    return []
  },
  async update(e, w) {
    return []
  },
  async remove(e, d) {
    return []
  },
  async create(e, d) {
    return {}
  },
  async executeDiff(d) {},
  async postDiffToServer(d) {},
  async postComputeToServer(c) {

    const newContext: IHookContext = await fetch(`${hostConfig}/${c.name}`, {
      method: 'POST',
      body: JSON.stringify(c)
    }).then(r => r.json())

    return newContext
  },
})


export function render (f: any) {

  const ele = createElement(f)

  const app = createRoot(document.getElementById('app')!)
  app.render(ele)
}
