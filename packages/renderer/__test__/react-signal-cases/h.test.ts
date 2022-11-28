import { clearIdIndex, createRenderer } from '../../src'
import {
  simpleModule,
  moduleHasMultipleChild,
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
      props: {},
      children: undefined
    })
  })
  it('simple has multiple', () => {
    const r = moduleHasMultipleChild().layout()

    expect(r).toEqual({
      id: 2,
      tag: 'div',
      props: { id: 1 },
      children: [
        {
          id: 0,
          tag: 'div',
          props: {},
          children: '1'    
        },
        {
          id: 1,
          tag: 'div',
          props: {},
          children: '2'    
        },
      ]
    })
  })
})