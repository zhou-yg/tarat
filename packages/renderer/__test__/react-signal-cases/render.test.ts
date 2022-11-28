import { clearIdIndex, createRenderer, isVirtualNode, VirtualLayoutJSON } from '../../src'
import {
  simpleModule,
  moduleHasMultipleChild,
  layoutUseLogic,
  MockRectFramework,
  useStyleInLayout,
  useOtherModule,
  hasInputInLayout,
} from '../mock'

describe('render', () => {

  afterEach(() => {
    clearIdIndex()
  })

  it('layout use logic', () => {

    const rr = createRenderer(layoutUseLogic(), {
      framework: MockRectFramework
    })

    rr.construct({ name: 'test' })
    const rr3 = rr.render()

    expect(rr3).toEqual({
      type: 'div',
      props: { name: 'test', "is-container": 1 },
      children: 1
    })
  })

  it('layout use style', () => {
    const rr = createRenderer(useStyleInLayout(), {
      framework: MockRectFramework
    })
    const rr2 = rr.construct({ name: 'test2' })
    const rr3 = rr.render()

    expect(rr3).toEqual({
      type: 'div',
      props: { name: 'test2', style: { color: 'red' } },
      children: { type: 'span', props: {}, children: 1 }
    })
  })

  it('layout use other module', () => {
    const rr = createRenderer(useOtherModule(), {
      framework: MockRectFramework
    })
    const rr2 = rr.construct()
    const rr3 = rr.render()

    expect(rr3).toEqual({
      type: 'div',
      props: { style: { color: 'red' } },
      children: [
        {
          type: 'span',
          props: {},
          children: 1,
        },
        {
          type: 'div',
          props: { name: 'm2', 'is-container': 1 },
          children: 1,        
        }
      ]
    })
  })

  it.only('auto add input handler', () => {
    const rr = createRenderer(hasInputInLayout(), {
      framework: MockRectFramework
    })
    const rr2 = rr.construct()

    expect(isVirtualNode(rr2.children)).toBe(true)
    expect((rr2.children as VirtualLayoutJSON).props.onInput.name).toBe('reactSignalTransformOnInput')
  })
})