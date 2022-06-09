fs =  require('fs')

const n = fs.readdirSync('./design').filter(f => /\.md/.test(f)).map(f => {
  return fs.readFileSync(`./design/${f}`).toString().split('').filter(char => !!char).length
}).reduce((p, n) => p + n)

console.log('words: ', n);


const n2 = fs.readdirSync('./design').filter(f => /\.md/.test(f)).map(f => {
  return fs.readFileSync(`./design/${f}`).toString().split('\n').length
}).reduce((p, n) => p + n)

console.log('rows: ', n2);