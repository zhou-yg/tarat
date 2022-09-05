const acorn = require( 'acorn')
const walk = require('acorn-walk')

const code = ` import 'foo'
 import XX from 'foo'
 import BB, { a } from 'foo'
 import { bb } from 'foo'
 import * as CC from 'foo'

 function aFunc() {  
   a()
}

b()
const d = cc.aa.bb
`

const ast = acorn.parse(code, { sourceType: 'module' })
console.log('ast: ', ast.body[ast.body.length - 1].declarations);

walk.simple(ast, {
  Identifier (n) {
    console.log('n: ', n);
    // walk.simple(n, {
    //   Identifier (n) {
    //     console.log('n2: ', n);
    //   }
    // })
  }
})

const arr = code.split('\n');
const newArr = arr.filter((line, i) => {
  const r1 = /import/.test(line) && /from/.test(line)
  const w = line.replace(/(\* as)|\{|\}|\,/g, '').match(/\w+/g)
  console.log('w: ', w);
  if (w && r1) {
    const si = w.indexOf('import')
    const ei = w.indexOf('from')
    const w2 = w.slice(si+1, ei)
    console.log('w2: ', w2);

    if (si >= 0 && ei >= 0) {

      let r = false
      walk.simple(ast, {
        Identifier (n) {
          r = r || w2.includes(n.name)
        }
      })
      if (r) {
        console.log(w2)
      }
      return r
  
    } else {
      return false
    }
  }
  return true
})

console.log(newArr.join('\n'))