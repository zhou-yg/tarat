import { cloneDeep, getPlugin, IDiff, IHookContext, IQueryWhere, set, setEnv } from '../../src/index'
import {
  Runner,
} from '../../src/'

import * as mockBM from '../mockBM'

describe('cache', () => {
  describe('mount cache', () => {
    beforeEach(() => {
      getPlugin('Cache').clearValue('', 'cookie')
    })
  
    it ('simple cache', async () => {
      const runner = new Runner(mockBM.onlyCache)
      const result = runner.init()
  
      const cVal = await result.c()
  
      expect(cVal).toBe(undefined)
    })
    it('update cache data', async () => {
      const runner = new Runner(mockBM.onlyCache)
      const result = runner.init()

      await result.c(() => ({
        num: 1
      }))
      const val = await result.c()

      expect(val).toEqual({ num: 1 })
      
      const cookieVal = await getPlugin('Cache').getValue('num', 'cookie')
      expect(cookieVal).toEqual({ num: 1 })
    })

    it('update cahce in IC', async () => {
      const runner = new Runner(mockBM.cacheInIC)
      const result = runner.init()

      await result.changeC1(2)
      
      expect(await result.c()).toEqual({ num:2 })

      const cookieVal = await getPlugin('Cache').getValue('num', 'cookie')
      expect(cookieVal).toEqual({ num: 2 })
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
  
  describe('update cache', () => {
    beforeEach(() => {
      getPlugin('Cache').clearValue('', 'cookie')
    })
    it('initialize simple cache with context', async () => {
      const runner = new Runner(mockBM.onlyCache)
      const cd: IHookContext['data'] = [
        ['data', 2],
      ]
      const context = mockBM.initContext({
        data: cd,
      })
      const result = runner.init([], context)
  
      const cVal = await result.c()
  
      expect(cVal).toBe(undefined)
    })
  })
})
