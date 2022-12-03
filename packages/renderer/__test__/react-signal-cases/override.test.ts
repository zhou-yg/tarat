import { clearIdIndex, createRenderer, extendModule, h, isVirtualNode, VirtualLayoutJSON } from '../../src'
import * as mock from '../mock'

describe('override', () => {

  it('simple', () => {
    const simpleModule = mock.simpleModule()
    const newModule = extendModule<{ num: number }>(simpleModule, {
      layout: (props, json) => {
        json.div.insert(h('span', { num: 2 }, 'insert new'))
      }
    })

    const r = createRenderer(newModule, {
      framework: mock.MockRectFramework,
    });
    const r2 = r.construct({ num: 1 })
    const r3 = r.render()

    expect(r3).toEqual({
      type: 'div',
      props: {},
      children: {
        type: 'span',
        props: { num: 2 },
        children: 'insert new',
      }
    })
  })
})
