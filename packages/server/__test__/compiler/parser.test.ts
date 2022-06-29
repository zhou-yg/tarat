import * as mockUtil from '../mockUtil'
import { parse } from '../../src/compiler/analyzer'

describe('parser', () => {
  it ('parse single BM', () => {
    const BM = 'singleBM.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps).toEqual({
      singleBM: [
        [1, [0], []]
      ]
    })
  })

  it ('parse with inputServer', () => {
    const BM = 'inputCompute.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps).toEqual({
      singleBM: [
        [1, [0], []],
        [2, [1, 0], [0]]
      ]
    })    
  })
  it ('parse model.query', () => {
    const BM = 'model.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    expect(deps).toEqual({
      singleBM: [
        [1, [0], []],
        [2, [0, 1], []]
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
})
