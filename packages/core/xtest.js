import { produceWithPatches, enablePatches, produce, applyPatches } from 'immer'

enablePatches()

const obj = {
  a: {
    b: 1
  }
}

const obj2 = produce(obj, d => {

  d.a.c = 3;
})
console.log('obj2: ', obj2, Object.isFrozen(obj2), Object.isFrozen(obj));

const obj3 = produce(obj2, d => {
  d.a.c = 4
})

setTimeout(() =>  {
  console.log('obj2: ', obj3, Object.isFrozen(obj3));
}, 100)


const proxyObj3 = new Proxy(obj3, {
  get (source, p) {
    return new Proxy(source[p], {
      get (source, p) {
        return source[p]
      }
    })
  }
})

console.log(proxyObj3.a)
console.log(proxyObj3.a.c)

