import { clearIdIndex, createRenderer, VirtualNodeTypeSymbol } from '../../src'
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
      type: 'div',
      props: {},
      children: undefined,
      flags: VirtualNodeTypeSymbol,
    })
  })
  it('simple has multiple', () => {
    const r = moduleHasMultipleChild().layout()

    expect(r).toEqual({
      id: 2,
      type: 'div',
      flags: VirtualNodeTypeSymbol,
      props: { id: '1' },
      children: [
        {
          id: 0,
          type: 'div',
          flags: VirtualNodeTypeSymbol,
          props: {},
          children: '1'    
        },
        {
          id: 1,
          type: 'div',
          flags: VirtualNodeTypeSymbol,
          props: {},
          children: '2'    
        },
      ]
    })
  })
})