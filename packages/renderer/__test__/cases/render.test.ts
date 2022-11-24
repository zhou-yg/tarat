import { clearIdIndex, createRenderer } from '../../src'
import {
  simpleModule,
  moduleHasMultipleChild,
  layoutUseLogic,
  MockRectFramework,
  useStyleInLayout,
} from '../mock'

describe('render', () => {

  afterEach(() => {
    clearIdIndex()
  })

  it('layout use logic', () => {

    const rr = createRenderer(layoutUseLogic(), {
      framework: MockRectFramework
    })

    const rr2 = rr.render({ name: 'test' })

    expect(rr2).toEqual({
      type: 'div',
      props: { name: 'test', container: true },
      children: 1
    })
  })

  it('layout use style', () => {
    const rr = createRenderer(useStyleInLayout(), {
      framework: MockRectFramework
    })
    const rr2 = rr.render({ name: 'test2' })

    expect(rr2).toEqual({
      type: 'div',
      props: { name: 'test2', style: { color: 'red' } },
      children: { type: 'span', props: {}, children: 1 }
    })
  })
})