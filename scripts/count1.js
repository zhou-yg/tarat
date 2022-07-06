fs =  require('fs')
path = require('path')
const doc = path.join(__dirname, '../doc')

const n = fs.readdirSync(path.join(doc, './design')).filter(f => /\.md/.test(f)).map(f => {
  return fs.readFileSync(path.join(doc, `./design/${f}`)).toString().split('').filter(char => !!char).length
}).reduce((p, n) => p + n)

console.log('words: ', n);


const n2 = fs.readdirSync(path.join(doc, './design')).filter(f => /\.md/.test(f)).map(f => {
  return fs.readFileSync(path.join(doc, `./design/${f}`)).toString().split('\n').length
}).reduce((p, n) => p + n)

console.log('rows: ', n2);