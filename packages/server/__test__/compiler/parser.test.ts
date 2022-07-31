import * as mockUtil from '../mockUtil'
import { parseDeps as parse } from '../../src/'

describe('parser', () => {
  it('parse single BM', () => {
    const BM = 'singleBM.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps).toEqual({
      singleBM: [
        ['h', 1, [0]]
      ]
    })
  })

  it ('parse with inputServer', () => {
    const BM = 'inputCompute.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps).toEqual({
      singleBM: [
        ['h', 1, [0]],
        ['h', 2, [1, 0], [0]]
      ]
    })    
  })
  it ('parse model.query', () => {
    const BM = 'model.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps).toEqual({
      singleBM: [
        ['h', 1, [0]],
        ['h', 2, [0, 1]]
      ]
    })    
  })
  it ('parse simple model', () => {
    const BM = 'simpleModel.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps).toEqual({
      singleBM: []
    })    
  })

  it('parsw with compose', () => {
    const BM = 'compose2.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)
    // console.log('deps: ', JSON.stringify(deps, null, 2));

    expect(deps).toEqual({
      composeWithSS2: [
        ['h', 1, [], [0]],
        ['h', 2, [
          0,
          ['c', 0, 's1'],
          ['c', 1, 's2'],
          ['c', 2, 's1'],
        ]]
      ]
    })
  })
})
