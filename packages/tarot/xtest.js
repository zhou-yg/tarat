const { produceWithPatches, enablePatches, applyPatches } = require('immer')

enablePatches()

const r = produceWithPatches(undefined, (draft) => {
  
  return 1
})
console.log('r: ', r);

const v2 = applyPatches(3, r[1])
console.log('v2: ', v2);
