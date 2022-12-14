import { CommandOP, createRenderer, extendModule, h, isVirtualNode, LayoutStructTree, VirtualLayoutJSON } from '../../src'
import * as mock from '../mock'

describe('override', () => {

  it('extend twice', () => {
    
    const baseModule = mock.layoutHasTypes()

    const newModule2 = extendModule(baseModule, () => ({
      patchLayout (props, jsonDraft) {
        return [
          {
            op: CommandOP.addChild,
            parent: jsonDraft.div,
            child: { type: 'p', children: ['123'] } // h('p', {}, '123')
            // child: h('p', {}, '123')
          }
        ] as const
      }
    }))

    const r = createRenderer(newModule2, {
      framework: mock.MockRectFramework
    })
    const r1 = r.construct({ name: 'newModule2' })
    const r2 = r.render()

    expect(r2).toEqual({
      type: 'div',
      props: {
        style: {
          color: 'red'
        }
      },
      children: [
        {
          type: 'div',
          props: {},
          children: 'newModule2'
        },        
        {
          type: 'p',
          props: {},
          children: '123'
        },
      ]
    })

    const newModule3 = extendModule(newModule2, () => ({
      patchLayout (props, root) {
        return [
          {
            op: 'addChild',
            parent: root.div.p,
            child: { type: 'text', children: ['456'] } // h('text', {}, '456')
          }
        ] as const 
      }
    }))

    const r3 = createRenderer(newModule3, { framework: mock.MockRectFramework })
    const r4 = r3.construct({ name: 'newModule3' })
    const r5 = r3.render()
    
    expect(r5).toEqual({
      type: 'div',
      props: {
        style: {
          color: 'red'
        }
      },
      children: [
        {
          type: 'div',
          props: {},
          children: 'newModule3'
        },        
        {
          type: 'p',
          props: {},
          children: [
            '123',
            {
              type: 'text',
              props: {},
              children: '456'
            }
          ]
        },
      ]
    })
  })
})
