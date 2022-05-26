import { calculateDiff } from '../../src/util'
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
          
          value: {
            num: '0'
          },
          currentFieldPath: 'child',
        }
      ])
    })
    it ('array', () => {
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
          source: { num0: null },
          value: {
            num0: 0,
            num1: 1
          },
          currentFieldPath: '',
        }
      ])
      expect(diff.create).toEqual([
        {
          
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
          source: { num0: null },
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
          value: {
            num0: 1,
          },
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
          value: {
            num0: 1,
          },
          currentFieldPath: '',
        },
        {
          value: {
            num0: 2,
          },
          currentFieldPath: '',
        }
      ])
    })
    it('array remove multi elements not tail', () => {
      const origin = [
        { num0: null, child: [{ num0: 1 }] },
        { num0: 1 },
        { num0: 2 },
        { num0: 3 }
      ]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d.splice(1, 2)
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          value: {
            num0: 1,
          },
          currentFieldPath: '',
        },
        {
          value: {
            num0: 2,
          },
          currentFieldPath: '',
        }
      ])
    })
    it('array remove child one element', () => {
      const origin = [
        { num0: null, child: [{ num0: 1 }] },
        { num0: 1 },
        { num0: 2 },
      ]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d[0].child.splice(0, 1)
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([
        {
          value: {
            num0: 1,
          },
          currentFieldPath: 'child',
        }
      ])
    })
  })
})