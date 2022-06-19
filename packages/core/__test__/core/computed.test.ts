import {
  IHookContext,
  Runner,
} from '../../src/'

import * as mockBM from '../mockBM'

describe('computed', () => {
  describe('mount computed', () => {
    it('blank', () => {
      const cv = 1
      const runner = new Runner(mockBM.blankComputed)
      const result = runner.init([cv])
  
      expect(result.c()).toBe(cv)
    })
    it('use primitive state', () => {
      const num1 = 1
      const num2 = 2
      const runner = new Runner(mockBM.onePrimitiveStateComputed)
      const result = runner.init([num1, num2])
  
      expect(result.c()).toBe(num1 + num2)
  
      expect(result.s._hook.watchers.size).toBe(2)
      expect(result.s._hook.watchers.has(runner.scope.watcher)).toBe(true)
      expect(result.s._hook.watchers.has(result.c._hook.watcher)).toBe(true)
    })
    it('use primitive state', async () => {
      const num1 = 1
      const num2 = 2
      const runner = new Runner(mockBM.asyncComputed)
      const result = runner.init([num1, num2])
  
      const c1 = result.c()
      expect(c1).toBe(undefined)
  
      await runner.ready()
  
      expect(result.c()).toBe(num1 + num2)
  
      expect(result.s._hook.watchers.size).toBe(2)
      expect(result.s._hook.watchers.has(runner.scope.watcher)).toBe(true)
      expect(result.s._hook.watchers.has(result.c._hook.watcher)).toBe(true)
    })
    it('use primitive state, change one time', async () => {
      const num1 = 1
      const num2 = 2
      const runner = new Runner(mockBM.onePrimitiveStateComputed)
      const result = runner.init([num1, num2])
  
      expect(result.c()).toBe(num1 + num2)
  
      expect(runner.scope.hooks.length).toBe(2)
      expect((runner.scope.hooks[1]).watchers.size).toBe(1)
  
      result.s((v: number) => v + 1)
      // await mockBM.wait()
  
      expect(result.c()).toBe(num1 + num2 + 1)
      expect(result.s._hook.watchers.size).toBe(2)
      expect(result.s._hook.watchers.has(runner.scope.watcher)).toBe(true)
      expect(result.s._hook.watchers.has(result.c._hook.watcher)).toBe(true)
    })
    it('use array', async () => {
      const runner = new Runner(mockBM.computedWithArray)
      const result = runner.init()
  
      expect(result.arr()).toEqual([{ num: 0 }, { num: 1 }, { num: 2 }, { num: 3 }, { num: 4 }])
      expect(result.guard()).toBe(2)
      expect(result.arr2()).toEqual([{ num: 0 }, { num: 1 }])
      
      result.guard((d: number) => d + 1)
      // await mockBM.wait()
      
      expect(result.arr()).toEqual([{ num: 0 }, { num: 1 }, { num: 2 }, { num: 3 }, { num: 4 }])
      expect(result.guard()).toBe(3)
      expect(result.arr2()).toEqual([{ num: 0 }, { num: 1 }, { num: 2 }])
    })
  })
  describe('update computed', () => {
    it ('use primitive state, getter wont run', () => {
      const num1 = 1
      const num2 = 2
      const runner = new Runner(mockBM.onePrimitiveStateComputed)
      const cd: IHookContext['data'] = [
        ['data', 2],
        ['data', 10]  
      ]
      const context = mockBM.initContext({
        data: cd,
      })
      const result = runner.init([num1, num2], context)
  
      expect(result.c()).toBe(cd[1][1])
  
      expect(result.s._hook.watchers.size).toBe(1)
      expect(result.s._hook.watchers.has(runner.scope.watcher)).toBe(true)
      expect(result.s._hook.watchers.has(result.c._hook.watcher)).toBe(false)
    })
  })
})
