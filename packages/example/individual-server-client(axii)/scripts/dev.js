import { execa } from 'execa'
import childProcess from 'node:child_process';

import * as path from 'path'

const clientCwd = path.resolve('./client/')
const serverCwd = path.resolve('./server/')

const client = childProcess.spawn('npx', ['vite', '--force'], {
  cwd: clientCwd
})
client.stdout.on('data', (data) => {
  console.log(`client: ${data}`);
})
client.stderr.on('data', (data) => {
  console.log(`client-error: ${data}`);
})

const server = childProcess.spawn('node', ['--loader', 'ts-node/esm', 'app.ts'], {
  cwd: serverCwd
})
server.stdout.on('data', (data) => {
  console.log(`server: ${data}`);
})
server.stderr.on('data', (data) => {
  console.log(`server-error: ${data}`);
})
