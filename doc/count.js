fs =  require('fs')

const n = fs.readdirSync('./design').filter(f => /\.md/.test(f)).map(f => {
  return fs.readFileSync(`./design/${f}`).toString().split('').filter(char => !!char).length
}).reduce((p, n) => p + n)
console.log('n: ', n);
