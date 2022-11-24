import { clearIdIndex, createRenderer } from '../../src'
import {
  simpleModule,
  moduleHasMultipleChild,
  layoutUseLogic,
  MockRectFramework,
  useStyleInLayout,
  useOtherModule,
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
      props: { name: 'test', container: 1 },
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
    console.log('rr3: ', rr3.children);

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
})