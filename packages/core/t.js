const im = require('immer')
im.enablePatches()
const a = [
  {
    name: 1
  }
]
const [newA, patches] = im.produceWithPatches(a, (d) => {
  d[1] = {
    a:1,
    b:2
  }
  d[0] = null
  d.push({a: 2, b:3})
  d.splice(0 ,0, { a: 3, b:4 })
})
console.log('newA: ', newA);
console.log('patches: ', patches);