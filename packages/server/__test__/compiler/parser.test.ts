import * as mockUtil from '../mockUtil'
import { parse } from '../../src/compiler/analyzer'

describe('parser', () => {
  it ('parse single BM', () => {
    const BM = 'singleBM.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    mockUtil.writeDepsMock(BM, deps)

    expect(deps).toEqual({
      singleBM: [
        [1, [0]]
      ]
    })
  })

  it ('parse with inputServer', () => {
    const BM = 'inputCompute.js'
    const code = mockUtil.readMock(BM)

    const deps = parse(code)

    mockUtil.writeDepsMock(BM, deps)

    expect(deps).toEqual({
      singleBM: [
        [1, [0]],
        [2, [1, 0]]
      ]
    })    
  })
})
