const im = require('immer')
im.enablePatches()
const a = [
  {
    name: 1
  }
]
const [newA, patches] = im.produceWithPatches(a, (d) => {
  d[0].name =3
})
console.log('newA: ', newA);
console.log('patches: ', patches);