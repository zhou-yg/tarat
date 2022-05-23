const {
  ref,
  effect
} = require('@vue/reactivity')

const {produce, enablePatches} = require('immer')

enablePatches()

let state = {
  name: "Micheal",
  age: {
    num: 2
  }
}

let fork = state
let changes = []
let inverseChanges = [];

(async function a() {

  const s2 = {
    v2: 1
  }

fork = await produce(  
  fork,
  async draft => {
      draft.age.num++
      draft.age.v2 = 'v2'
      delete draft.name

      const s22 = produce(s2, draft => {
        draft.v2++
      })
      draft.age.v2 = s22
  },
  (patches, inversePatches) => {
      changes.push(...patches)
      inverseChanges.push(...inversePatches)
  }
)

console.log('changes: ', changes);

console.log('fork: ', fork);

})()
