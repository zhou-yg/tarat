import { execa } from 'execa'
import childProcess from 'node:child_process';

import * as path from 'path'

const clientCwd = path.resolve('./client/')
console.log('clientCwd: ', clientCwd);
const serverCwd = path.resolve('./server/')

const client = childProcess.spawn('npx', ['vite'], {
  cwd: clientCwd
})
client.stdout.on('data', (data) => {
  console.log(`client: ${data}`);
})

const server = childProcess.spawn('node', ['--loader', 'ts-node/esm', 'app.ts'], {
  cwd: serverCwd
})
server.stdout.on('data', (data) => {
  console.log(`server: ${data}`);
})
