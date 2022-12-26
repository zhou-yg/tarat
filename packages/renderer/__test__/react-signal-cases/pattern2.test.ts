import { ACTIVE, clearIdIndex, constructCSSObj, createPatternCSS, createRenderer, createRenderer2, HOVER, isVirtualNode, mergeStyleObjs, PatternMatrix2, SELECTED, VirtualLayoutJSON } from '../../src'
import * as mock from '../mock'

describe('pattern2', () => {
  describe ('basic utils', () => {
    it ('constructCSSObj', () => {
      console.error = jest.fn()

      const matrix: PatternMatrix2 = [
        [HOVER, ACTIVE, SELECTED],
        {
          container: {
            color: {
              red: [[1, 1, 1]],
              blue: [0, 1, 0],
            }
          }
        }
      ]

      const objs = constructCSSObj(matrix)

      expect(console.error).toBeCalledTimes(1)
      expect(objs).toEqual([
        {
          attr: [[SELECTED, 1]],
          style: { color: 'red' },
          pseudo: HOVER,
          sematic: 'container',
        },
        {
          attr: [[SELECTED, 0]],
          style: { color: 'blue' },
          pseudo: ACTIVE,
          sematic: 'container',
        },
      ])
    })

    it ('mergeStyleObjs', () => {
      const matrix: PatternMatrix2 = [
        [HOVER, ACTIVE, SELECTED],
        {
          container: {
            color: {
              red: [[1, 0, 1]],
              blue: [0, 1, 0],
            },
            fontSize: {
              '12px': [[1, 0, '*']],
              '6px': [0, 1, 0],
              '0px': [1,0,'*'] // cover '12px'
            }
          }
        }
      ]

      const objs = constructCSSObj(matrix)
      const mergedObjs = mergeStyleObjs(objs)
      
      expect(mergedObjs).toEqual([
        {
          attr: [[SELECTED, 1]],
          style: { color: 'red' },
          pseudo: HOVER,
          sematic: 'container',
        },
        {
          attr: [[SELECTED, 0]],
          style: { color: 'blue', fontSize: '6px' },
          pseudo: ACTIVE,
          sematic: 'container',
        },
        {
          attr: [],
          style: { fontSize: '0px' },
          pseudo: HOVER,
          sematic: 'container',
        },
      ])
    })

    it ('createPatternCSS', () => {
      const matrix: PatternMatrix2 = [
        [HOVER, ACTIVE, SELECTED],
        {
          container: {
            color: {
              red: [[1, 0, 1]],
              blue: [0, 0, 0],
            },
            fontSize: {
              '12px': [[1, 0, '*']],
              '6px': [0, 1, 0],
              '0px': [1,0,'*'] // cover '12px'
            }
          }
        }
      ]
      const clsObj = createPatternCSS(matrix)

      expect(clsObj.container.length).toEqual(4)
    })
  })

  it('new pattern module', () => {
    const module = mock.moduleHasNewDesignPatterns();
    const r = createRenderer(module, {
      framework: mock.MockRectFramework
    })
    const r2 = r.construct()
    const r3 = r.render()

    expect(r3).toEqual({
      type: 'div',
      props: {
        'is-container': 1,
        selected: true,
        disabled: false,
        className: 'css-9q5arm css-eq2hm3',
        'data-selecteddisabled': '10'
      },
      children: undefined
    })
  })
})