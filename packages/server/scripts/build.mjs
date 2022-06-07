import * as child_process from 'child_process'
import shelljs from 'shelljs'

import { execa } from 'execa'

const { cp } = shelljs;

(async () =>{

  await execa('rollup', ['--config', 'rollup.config.mjs'], {
    cwd: process.cwd()
  })
  
  cp('src/middlewares/viewTemplate.ejs', 'dist/cli/')
  cp('src/middlewares/viewTemplate.ejs', 'dist/')
  cp('src/adaptors/runtime-helper/defaultRenderReact.ejs', 'dist/cli/')
  cp('src/adaptors/runtime-helper/defaultRenderReact.ejs', 'dist/')

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