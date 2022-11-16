import { clearIdIndex, createRenderer } from '../../src'
import {
  simpleModule,
  layoutUseLogic,
  MockRectFramework,
  useStyleInLayout,
} from '../mock'

describe('h factory and hooks', () => {

  afterEach(() => {
    clearIdIndex()
  })

  it('simple', () => {
    const r = simpleModule().layout()

    expect(r).toEqual({
      id: 0,
      tag: 'div',
      props: null,
      children: undefined
    })
  })
  it('layout use logic', () => {

    const rr = createRenderer(layoutUseLogic(), {
      framework: MockRectFramework
    })

    const rr2 = rr.render({ name: 'test' })

    expect(rr2).toEqual({
      id: 0 + 1, // 这里用 h mock了，h 多执行了1次，所以 id + 1 了
      tag: 'div',
      props: { name: 'test' },
      children: 1
    })
  })

  it('layout use style', () => {
    const rr = createRenderer(useStyleInLayout(), {
      framework: MockRectFramework
    })
    const rr2 = rr.render({ name: 'test2' })

    expect(rr2).toEqual({
      id: 0 + 2,
      tag: 'div',
      props: { name: 'test2', style: { color: 'red' } },
      children: { id: 0, tag: 'span', props: null, children: 1 }
    })
  })
})