import { cloneDeep, getPlugin, IDiff, IQueryWhere, set, setEnv } from '../../src/index'
import {
  Runner,
} from '../../src/'

import * as mockBM from '../mockBM'

describe('cache', () => {

  beforeEach(() => {
    getPlugin('Cache').clearValue('num', 'cookie')
  })

  it ('simple cache', async () => {
    const runner = new Runner(mockBM.onlyCache)
    const result = runner.init()

    const cVal = await result.c()

    expect(cVal).toBe(undefined)
  })
  it ('cache with source', async () => {
    const runner = new Runner(mockBM.cacheWithSource)
    const initialVal = { num: 0 }
    const result = runner.init([initialVal])

    const cVal = await result.c()

    expect(cVal).toEqual(initialVal)

    result.s(d => {
      d.num = 1
    })

    expect(result.c._hook._internalValue).toBe(undefined)

    const cVal2 = await result.c()
    expect(cVal2).toEqual({ num: 1 })
  })
  
})
