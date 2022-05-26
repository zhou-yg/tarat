import { calculateDiff } from '../../src/util'
import { produceWithPatches, enablePatches } from 'immer'

enablePatches()

describe('util', () => {
  describe('calculate diff', () => {
    it('object add property', () => {
      const origin = { num0: undefined }
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        d.num0 = 0
        d.num1 = 1
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([
        {
          
          value: {
            num0: 0,
            num1: 1
          },
          currentPath: '',
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
          currentPath: 'child',
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
          value: {
            num0: 1,
            num1: null
          },
          
          currentPath: 'child',
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
          
          value: {
            num: null
          },
          currentPath: '',
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
          currentPath: 'child',
        }
      ])
    })
    it ('array', () => {
      const origin = [{ num0: undefined }]
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
          
          value: {
            num0: 0,
            num1: 1
          },
          currentPath: '',
        }
      ])
      expect(diff.create).toEqual([
        {
          
          value: {
            num2: 2
          },
          currentPath: ''
        }
      ])
      expect(diff.remove).toEqual([])
    })
    it ('array nested object', () => {
      const origin = [{ num0: undefined, child: { num0: null } }]
      const [r, patches] = produceWithPatches(origin, (d: any) => {
        const { child } = d[0]
        child.num0 = 0
        child.num1 = 1
      })

      const diff = calculateDiff(origin, patches)
      expect(diff.update).toEqual([
        {
          
          value: {
            num0: 0,
            num1: 1
          },
          currentPath: 'child',
        }
      ])
      expect(diff.create).toEqual([])
      expect(diff.remove).toEqual([])
    })
    it('array push to object.child', () => {
      const origin = [{ num0: undefined, child: [] }]
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
          currentPath: 'child',
        }
      ])
      expect(diff.remove).toEqual([])
    })
  })
})