const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const f = join(__dirname, './dist/connect.client.esm.js')

const code = readFileSync(f).toString()

const newCode = code.replace(`from 'tarat/core'`, `from 'tarat/core.client.esm'`)

writeFileSync(f, newCode)

