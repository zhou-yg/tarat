import * as mockUtil from '../mockUtil'
import { parseDeps as parse } from '../../src/'

describe('parser', () => {
  it('parse single BM', () => {
    const BM = 'singleBM.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps).toEqual({
      singleBM: {
        names: [
          [0, 's1'],
          [1, 'c1'],
        ],
        deps: [
          ['h', 1, [0]]
        ]
      }
    })
  })

  it ('parse with inputServer', () => {
    const BM = 'inputCompute.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps).toEqual({
      singleBM: {
        names: [
          [0, 's1'],
          [1, 'c1'],
          [2, 'ic']
        ],
        deps: [
          ['h', 1, [0]],
          ['h', 2, [1, 0], [0]]
        ]
      }
    })    
  })
  it ('parse model.query', () => {
    const BM = 'model.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps.singleBM.deps).toEqual(
      [
        ['h', 1, [0]],
        ['h', 2, [0, 1]]
      ]
    )
  })
  it ('parse simple model', () => {
    const BM = 'simpleModel.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps).toEqual({
      singleBM: {
        names: [[0, 's1'], [1, 'items']],
        deps: []
      }
    })    
  })

  it('parsw with compose', () => {
    const BM = 'compose2.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps.composeWithSS2.deps).toEqual(
      [
        ['h', 1, [], [0]],
        ['h', 2, [
          0,
          ['c', 0, 's1'],
          ['c', 1, 's2'],
          ['c', 2, 's1'],
        ]]
      ]
    )
  })

  it('parse with writeModel', () => {
    const BM = 'writeModel.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps).toEqual({
      writeModelDriver: {
        names: [
          [0, 's1'],
          [1, 'items'],
          [2, 'writeItems'],
          [3, 'ic'],
        ],
        deps: [
          ['h', 1, [0]],
          ['h', 2, [1], [1]],
          ['h', 3, [2]],
        ]
      }
    })
  })
})
