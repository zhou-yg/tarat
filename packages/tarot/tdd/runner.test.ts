import { add } from '../src/service'

describe('runner', () => {

  describe('init', () => {

    it('a', () => {
      const r = add(2)
      expect(r).toEqual(2)
    })
  })
})