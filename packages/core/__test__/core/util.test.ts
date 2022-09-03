import { calculateDiff, checkQueryWhere, constructDataGraph, dataGrachTraverse, DataGraphNode, get, getRelatedIndexes, set, THookDeps } from '../../src/index'
import { produceWithPatches, enablePatches } from 'immer'

enablePatches()

describe('util', () => {
  describe('calculate diff', () => {
    it('object add property', () => {
      const origin = { num0: null }
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d.num0 = 0
        d.num1 = 1
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([
        {
          source: { num0: null },
          value: {
            num0: 0,
            num1: 1
          },
          currentFieldPath: '',
        }
      ])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([])
    })
    it('object add nested obj', () => {
      const origin = {}
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d.child = {
          num: 0
        }
        d.child.child2 = {
          num2: 2
        }
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([
        {
          source: origin,
          value: {
            num: 0,
            child2: {
              num2: 2
            }
          },
          currentFieldPath: 'child',
        }
      ])
      expect(diff.remove).toEqual([])
    })
    it('object modify property in nested obj', () => {
      const origin = {
        child: {
          num: 0,
          num1: 1
        }
      }
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        const { child } = d
        child.num0 = 1
        delete child.num1
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([
        {
          source: {
            num: 0,
            num1: 1  
          },
          value: {
            num0: 1,
            num1: null
          },
          
          currentFieldPath: 'child',
        }
      ])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([])
    })
    it('object remove property', () => {
      const origin = { num: 0 }
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        delete d.num
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([
        {
          source: { num: 0 },
          value: {
            num: null
          },
          currentFieldPath: '',
        }
      ])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([])
    })
    it('object remove nested obj', () => {
      const origin = { child: { num: '0' } }
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d.child.num = 'modified before remove'
        delete d.child
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          source: origin,
          value: {
            num: '0'
          },
          currentFieldPath: 'child',
        }
      ])
    })
    it('array', () => {
      const origin = [{ num0: null }]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d[0].num0 = 0
        d[0].num1 = 1
        d.push({
          num2: 2
        })
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([
        {
          source: origin[0],
          value: {
            num0: 0,
            num1: 1
          },
          currentFieldPath: '',
        }
      ])
      expect(diff.create).toEqual([
        {
          source: origin,          
          value: {
            num2: 2
          },
          currentFieldPath: ''
        }
      ])
      expect(diff.remove).toEqual([])
    })
    it ('array nested object', () => {
      const origin = [{ num0: null, child: { num0: null } }]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        const { child } = d[0]
        child.num0 = 0
        child.num1 = 1
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([
        {
          source: origin[0].child,
          value: {
            num0: 0,
            num1: 1
          },
          currentFieldPath: 'child',
        }
      ])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([])
    })
    it('array push to object.child', () => {
      const origin = [{ num0: null, child: [] }]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        const { child } = d[0]
        child.push({
          num2: 2
        })
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([
        {
          source: origin[0].child,
          value: {
            num2: 2,
          },
          currentFieldPath: 'child',
        }
      ])
      expect(diff.remove).toEqual([])
    })
    it('array remove one element', () => {
      const origin = [
        { num0: null, child: [{ num0: 1 }] },
        { num0: 1 },
        { num0: 2 },
      ]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d.splice(1, 1)
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          source: origin,
          value: {
            num0: 1,
          },
          currentFieldPath: '',
        }
      ])
    })
    it('array remove: shift element', () => {
      const origin = [
        { num0: null, child: [{ num0: 1 }] },
        { num0: 1 },
        { num0: 2 },
      ]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d.shift()
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          source: origin,
          value: { num0: null, child: [{ num0: 1 }] },
          currentFieldPath: '',
        }
      ])
    })
    it('array remove: pop element', () => {
      const origin = [
        { num0: null, child: [{ num0: 1 }] },
        { num0: 1 },
        { num0: 2 },
      ]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d.pop()
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          source: origin,
          value: { num0: 2 },
          currentFieldPath: '',
        }
      ])
    })
    it('array remove multi elements tail', () => {
      const origin = [
        { num0: null, child: [{ num0: 1 }] },
        { num0: 1 },
        { num0: 2 },
      ]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d.splice(1, 2)
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          source: origin,
          value: {
            num0: 1,
          },
          currentFieldPath: '',
        },
        {
          source: origin,
          value: {
            num0: 2,
          },
          currentFieldPath: '',
        }
      ])
    })
    it('array remove multi elements not tail & unshift', () => {
      const origin = [
        // 1
        { num0: null, child: [{ num0: 1 }] },
        { num0: 1 },
        { num0: 2 },
        { num0: 3 }
      ]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d[0].num0 = 0
        d.unshift(1)
        d.splice(1, 2)
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          source: origin,
          value: origin[0],
          currentFieldPath: '',
        },
        {
          source: origin,
          value: origin[1],
          currentFieldPath: '',
        }
      ])
    })
    it('array remove multi elements not tail & push', () => {
      const origin = [
        // 1
        { num0: null, child: [{ num0: 1 }] },
        { num0: 1 },
        { num0: 2 },
        { num0: 3 }
      ]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d[0].num0 = 0
        d.splice(1, 2)
        d.push(1)
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([
        {
          source: origin[0],
          value: {
            num0: 0,
          },
          currentFieldPath: '',
        }
      ])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          source: origin,
          value: {
            num0: 1,
          },
          currentFieldPath: '',
        },
        {
          source: origin,
          value: {
            num0: 2,
          },
          currentFieldPath: '',
        }
      ])
    })
    it('array remove child one element', () => {
      const origin = [
        { num0: null, child: [{ num0: 1 }, { num0: 2 }, { num0: 3 }] },
        { num0: 1 },
        { num0: 2 },
      ]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d[0].child.splice(1, 1)
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          source: origin[0].child,
          value: {
            num0: 2,
          },
          currentFieldPath: 'child',
        }
      ])
    })
    it('array remove child shift element', () => {
      const origin = [
        { num0: null, child: [{ num0: 1 }, { num0: 2 }, { num0: 2 }] },
        { num0: 1 },
        { num0: 2 },
      ]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d[0].child.shift()
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          source: origin[0].child,
          value: {
            num0: 1,
          },
          currentFieldPath: 'child',
        }
      ])
    })
    it('array remove all', () => {
      const origin = [
        { num0: null },
        { num0: 1 },
        { num0: 2 },
      ]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d.splice(0, d.length)
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          source: origin,
          value: { num0: null },
          currentFieldPath: '',
        },
        {
          source: origin,
          value: { num0: 1 },
          currentFieldPath: '',
        },
        {
          source: origin,
          value: { num0: 2 },
          currentFieldPath: '',
        },
      ])
    })
  })
  it('check invalid query`s where', () => {
    const r2 = checkQueryWhere({
      a: 2,
      b: 1
    })
    const r4 = checkQueryWhere({
      a: 2,
      b: 1,
      c: {
        a: 3
      }
    })
    const r6 = checkQueryWhere({
      a: 2,
      b: 1,
      c: {
        a: 3
      },
      d: [1, 2]
    })
    expect([r2, r4, r6]).toEqual([true, true, true])

    const r1 = checkQueryWhere({
      a: undefined,
      b: 1
    })
    const r3 = checkQueryWhere({
      a: 2,
      b: 1,
      c: {
        a: undefined
      }
    })
    const r5 = checkQueryWhere({
      a: 2,
      b: 1,
      c: {
        a: 3
      },
      d: [undefined, 2]
    })
    expect([r1, r3, r5]).toEqual([false, false, false])
  })


  describe('constructDataGraph', () => {
    it('simple single chain', () => {
      const depMaps: THookDeps = [
        ['h', 2, [1], []],
        ['h', 3, [], [1]],
      ]
      const rootNodes = constructDataGraph(depMaps)
      const arr = [...rootNodes]
  
      expect(arr[0].id).toBe(3)
      expect(arr[0].targets.size).toBe(1)
      expect(rootNodes.size).toEqual(1)

      const check = jest.fn((id) => {
        expect(id).toBe(3)
      })

      dataGrachTraverse(arr, (n, a) => {
        if (n.id === 1) {
          check(a[a.length - 1].id)
        }
      })
      expect(check).toBeCalledTimes(1)
      
      const allChildren = arr[0].getAllChildren()
      const childrenArr = [...allChildren]
      expect(childrenArr.length).toBe(2)
      expect(childrenArr[0].id).toBe(1)
      expect(childrenArr[1].id).toBe(2)
    })
    it('multi roots', () => {
      const depMaps: THookDeps = [
        ['h', 2, [1], []],
        ['h', 3, [], [1]],
        ['h', 4, [], [1]],
      ]
      const rootNodes = constructDataGraph(depMaps)
      const arr = [...rootNodes]
  
      expect(arr[0].id).toEqual(3)
      expect(arr[0].targets.size).toEqual(1)
      expect([...arr[0].targets][0].id).toEqual(1)
      expect(arr[1].id).toEqual(4)
      expect(arr[1].targets.size).toEqual(1)
      expect([...arr[1].targets][0].id).toEqual(1)
      expect(rootNodes.size).toEqual(2)

      const check = jest.fn((id) => {
        expect([3, 4]).toContain(id)
      })

      dataGrachTraverse(arr, (n, a) => {
        if (n.id === 1) {
          check(a[a.length - 1].id)
        }
      })
      expect(check).toBeCalledTimes(2)

    })
    it('multi roots multi child', () => {
      const depMaps: THookDeps = [
        ['h', 2, [1], []],
        ['h', 3, [], [1]],
        ['h', 5, [1], []],
        ['h', 4, [], [1]],
      ]
      const rootNodes = constructDataGraph(depMaps)
      const arr = [...rootNodes]
  
      expect(arr[0].id).toEqual(3)
      expect(arr[1].id).toEqual(4)
      expect(rootNodes.size).toEqual(2)

      expect(arr[0].id).toEqual(3)
      expect(arr[1].id).toEqual(4)
      expect(rootNodes.size).toEqual(2)

      const check = jest.fn((id) => {
        expect([1]).toContain(id)
      })

      dataGrachTraverse(arr, (n, a) => {
        if (n.id === 2) {
          check(a[a.length - 1].id)
        }
      })
      expect(check).toBeCalledTimes(2)
  
      const allChildren = arr[0].getAllChildren()
      const childrenArr = [...allChildren]
      expect(childrenArr.length).toBe(3)
      expect(childrenArr[0].id).toBe(1)
      expect(childrenArr[1].id).toBe(2)
      expect(childrenArr[2].id).toBe(5)
    })
    it('dependencies circle', () => {
      const depMaps: THookDeps = [
        ['h', 1, [2], [3]],
        ['h', 2, [3], []],
        ['h', 4, [], [3]],
      ]
      const rootNodes = constructDataGraph(depMaps)
      const arr = [...rootNodes]
      const cd = jest.fn((n: DataGraphNode, a: DataGraphNode[]) => {

      })
      dataGrachTraverse(arr, cd)

      expect(cd).toHaveBeenCalledTimes(4)
    })
  })

  describe('getRelatedIndexes', () => {
    it('simple', () => {
      const depMaps: THookDeps = [
        ['h', 2, [0]]
      ]
      const deps = getRelatedIndexes(2, depMaps)
      expect(deps).toEqual(new Set([2, 0]))
    })
    it('nested ic by inputCompute(i=2)', () => {
      const depMaps: THookDeps = [
        ['h', 1, [5], [6]],
        ['h', 2, [1,3], [4]],
      ]
      const deps = getRelatedIndexes(2, depMaps)
      expect(deps).toEqual(new Set([5,1,2,3,4,6]))
    })
    it('nested ic by inputCompute(i=1)', () => {
      const depMaps: THookDeps = [
        ['h', 1, [5], [6]],
        ['h', 2, [1,3], [4]],
      ]
      const deps = getRelatedIndexes(1, depMaps)
      expect(deps).toEqual(new Set([5,1,6]))
    })
    it('nested ic by model(i=1)', () => {
      const depMaps: THookDeps = [
        ['h', 1, [5]],
        ['h', 6, [1]],
        ['h', 2, [1,3], [4]],
      ]
      const deps = getRelatedIndexes(1, depMaps)
      expect(deps).toEqual(new Set([5,1,6]))
    })
    it('nested ic by inputCompute(i=2)', () => {
      const depMaps: THookDeps = [
        ['h', 1, [5]],
        ['h', 6, [1]],
        ['h', 2, [1,3], [4]],
      ]
      const deps = getRelatedIndexes(2, depMaps)
      expect(deps).toEqual(new Set([5,1,3,2,4]))
    })
    it('nested ic without target', () => {
      const depMaps: THookDeps = [
        ['ic', 1, [3, 4], []],
        ['ic', 2, [1], []],
        ['ic', 6, [2], [5]]
      ]
      const deps = getRelatedIndexes(1, depMaps)
      expect(deps).toEqual(new Set([1, 3, 4]))
    })
    it('double get chain', () => {
      const depMaps: THookDeps = [
        ['h', 1, [0]],
        ['h', 2, [1]]
      ]
      const deps = getRelatedIndexes(2, depMaps)
      expect(deps).toEqual(new Set([0, 1, 2]))
    })
    it('root -> get -> set', () => {
      const depMaps: THookDeps = [
        ['ic', 1, [], [0]],
        ['h', 2, [1]]
      ]
      const deps = getRelatedIndexes(2, depMaps)
      expect(deps).toEqual(new Set([2, 1, 0]))
    })
    it('(bad case) root -> get -> set -> set', () => {
      // bad case
      const depMaps: THookDeps = [
        ['h', 1, [], [0]],
        ['h', 2, [], [1]],
        ['h', 3, [2]],
      ]
      const deps = getRelatedIndexes(3, depMaps)
      expect(deps).toEqual(new Set([3, 2, 1]))
    })
    it ('root -> get -> set -> get', () => {
      const depMaps: THookDeps = [
        ['h', 0, [1], []],
        ['h', 2, [], [1]],
        ['h', 3, [2]],
      ]
      const deps = getRelatedIndexes(3, depMaps)
      expect(deps).toEqual(new Set([3, 2, 1, 0]))
    })
    it('root -> has same dep (get)', () => {
      const depMaps: THookDeps = [
        ['h', 2, [1], []],
        ['h', 3, [1], []],
      ]
      const deps = getRelatedIndexes(3, depMaps)
      expect(deps).toEqual(new Set([3, 1]))
    })
    it('root -> has same dep (set)', () => {
      const depMaps: THookDeps = [
        ['h', 2, [1], []],
        ['h', 3, [], [1]],
      ]
      const deps = getRelatedIndexes(3, depMaps)
      expect(deps).toEqual(new Set([3, 1, 2]))
    })
    it('complex 1', () => {
      const depMaps: THookDeps = [
        ["ic", 10, [5, 6, 4], [9, 5, 6, 4]],
        ["h", 12, [11]],
        ["ic", 13, [], [12]],
        ["h", 14, [12]],
        ["h", 15, [14]],
        ["h", 16, [15]],
        ["h", 17, [5, 6, 7]],
        ["ic", 19, [5, 6, 10, 8, 20], [9, 18]],
        ["ic", 20, [5, 6], [9, 2, 1, 13, 11, 18]],
        ["ic", 21, [11, 12], [11, 2, 1, 13]],
        ["ic", 22, [15], [4, 5, 6, 3]],
        ["ic", 23, [], [4, 5, 6, 3]],
        ["ic", 24, [15, 5, 6, 4, 23], [10]],  
      ]
      const deps = getRelatedIndexes(21, depMaps)
      expect(deps).toEqual(new Set([
        21, 11, 12, 1, 2, 13,
        14, 15, 16 // by 11 ->  12
      ]))
    })
    it('complex 2', () => {
      const depMaps: THookDeps = [
        ["ic", 10, [5, 6, 4], [9, 5, 6, 4]],
        ["h", 12, [11]],
        ["ic", 13, [], [12]],
        ["h", 14, [12]],
        ["h", 15, [14]],
        ["h", 16, [15]],
        ["h", 17, [5, 6, 7]],
        ["ic", 19, [5, 6, 10, 8, 20], [9, 18]],
        ["ic", 20, [5, 6], [9, 2, 1, 13, 11, 18]],
        ["ic", 21, [11, 12], [11, 2, 1, 13]],
        ["ic", 22, [15], [4, 5, 6, 3]],
        ["ic", 23, [], [4, 5, 6, 3]],
        ["ic", 24, [15, 5, 6, 4, 23], [10]],
      ]
      const deps = getRelatedIndexes(20, depMaps)
      expect(deps).toEqual(new Set([
        20, 5, 6, 9, 2, 1, 13, 11, 18,
        12, // by 13
        14, 15, 16 // by 12
      ]))
    })
  })

  describe('set/get', () => {
    it('set and get', () => {
      const obj = { a: [0, 1] }
      set(obj, ['a', '1'], 33)

      expect(obj.a[1]).toBe(33)

      const v = get(obj, ['a', 1])
      expect(v).toBe(33)
    })
  })
})