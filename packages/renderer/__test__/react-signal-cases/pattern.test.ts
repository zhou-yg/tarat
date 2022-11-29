import { clearIdIndex, createRenderer, isVirtualNode, VirtualLayoutJSON } from '../../src'
import * as mock from '../mock'

describe('pattern', () => {

  it('has multi matcher', () => {
    const rr = createRenderer(mock.patternHasMultiMatchers(), {
      framework: mock.MockRectFramework,
    })

    rr.construct({ v1: true, v2: false })
    const rr2 = rr.render()

    expect(rr2).toEqual({
      type: 'div',
      props: {
        'is-container': 1,
        style: {
          backgroundColor: 'red'
        }
      },
      children: 'i am container'
    })

    rr.construct({ v1: true, v2: true })
    const rr3 = rr.render()

    expect(rr3).toEqual({
      type: 'div',
      props: {
        'is-container': 1,
        style: {
          backgroundColor: 'green'
        }
      },
      children: 'i am container'
    })
  })
  it('has multi matcher with star', () => {
    const rr = createRenderer(mock.patternHasMultiMatchers2(), {
      framework: mock.MockRectFramework,
    })

    rr.construct({ v1: false })
    const rr2 = rr.render()

    expect(rr2).toEqual({
      type: 'div',
      props: {
        'is-container': 1,
        style: {
          backgroundColor: 'red'
        }
      },
      children: 'i am container'
    })

    rr.construct({ v1: true })
    const rr3 = rr.render()

    expect(rr3).toEqual({
      type: 'div',
      props: {
        'is-container': 1,
        style: {
          backgroundColor: 'green'
        }
      },
      children: 'i am container'
    })
  })
})