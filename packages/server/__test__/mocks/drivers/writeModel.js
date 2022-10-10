import {
  computed,
  inputComputeInServer,
  model,
  state,
  writePrisma,
  createPrisma,
} from 'tarat-core'

export default function writeModelDriver () {
  const s1 = state()

  const items = model('item', () => ({
    a: s1()
  }))

  const writeItems = writePrisma(items, () => ({
    b: 2,
    c: s1()
  }))

  // 3
  const ic = inputComputeInServer(() => {
    writeItems.create()
  })

  const createItems = createPrisma(items)

  return { ic, writeItems }
}
