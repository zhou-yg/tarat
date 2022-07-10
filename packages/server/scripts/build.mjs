import * as child_process from 'child_process'
import shelljs from 'shelljs'

import { execa } from 'execa'

const { cp } = shelljs;

(async () =>{

  await execa('rollup', ['--config', 'rollup.config.mjs'], {
    cwd: process.cwd()
  })
  
  cp('src/middlewares/pageTemplate.ejs', 'dist/cli/')
  cp('src/middlewares/pageTemplate.ejs', 'dist/')

  cp('src/adaptors/runtime-helper/defaultRenderReact.ejs', 'dist/cli/')
  cp('src/adaptors/runtime-helper/defaultRenderReact.ejs', 'dist/')
  
  cp('src/adaptors/runtime-helper/routesRenderEntry.ejs', 'dist/cli/')
  cp('src/adaptors/runtime-helper/routesRenderEntry.ejs', 'dist/')

  cp('src/compiler/routesTemplate.ejs', 'dist/cli/')
  cp('src/compiler/routesTemplate.ejs', 'dist/')
  
  cp('src/compiler/routesClientTemplate.ejs', 'dist/cli/')
  cp('src/compiler/routesClientTemplate.ejs', 'dist/')

  cp('src/compiler/defaultTsconfig.json', 'dist/cli/')
  cp('src/compiler/defaultTsconfig.json', 'dist/')

  cp('src/compiler/defaultEntryServer.jsx', 'dist/cli/')
  cp('src/compiler/defaultEntryServer.jsx', 'dist/')

  console.log('build end')

})()
// const instance = child_process.spawn('npm', ['run', 'build'], {
//   cwd: process.cwd()
// })

// instance.stdout.on('data', (data) => {
//   console.log(`instance: ${data}`);
// })
// instance.stderr.on('data', (data) => {
//   console.log(`instance-error: ${data}`);
// })