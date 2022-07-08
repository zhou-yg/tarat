fs =  require('fs')
path = require('path')
const server = path.join(__dirname, '../packages/server')

function readdir (dir) {
  const n2 = fs.readdirSync(dir).map(f => {
    if (fs.lstatSync(path.join(dir, `${f}`)).isDirectory()) {
      return readdir(path.join(dir, `${f}`))
    }
    return fs.readFileSync(path.join(dir, `${f}`)).toString().split('\n').length
  }).reduce((p, n) => p + n, 0)

  return n2
}

const n2 = readdir(path.join(server, './src'))

console.log('rows: ', n2);
