import { IConfig } from "../config";
import * as fs from 'fs'
import * as path from 'path'
import { InputOptions, ModuleFormat, OutputOptions, Plugin, rollup, RollupBuild } from 'rollup' 
import resolve from '@rollup/plugin-node-resolve';
import { babel  } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json'
import less from 'rollup-plugin-less'
import commonjs from "@rollup/plugin-commonjs";

interface IBuildOption {
  input: InputOptions
  output: OutputOptions[]
}

async function build (op: IBuildOption) {

  let bundle: RollupBuild | undefined
  try {
    bundle = await rollup(op.input)
    await generateOutput(bundle, op.output)
  } catch (e) {
    console.error(e)
  } finally {
    await bundle?.close()
  }
}

async function generateOutput(bundle: RollupBuild, o: IBuildOption['output']) {
  for (const op of o) {
    const { output } = await bundle.generate(op)
    for (const chunkOrAsset of output) {
      if (chunkOrAsset.type === 'asset') {
      } else if (chunkOrAsset.type === 'chunk') {
        const dir = op.file?.replace(chunkOrAsset.fileName, '')
        if (dir && !fs.existsSync(dir)) {
          fs.mkdirSync(dir)
        }
        if (op.file) {
          fs.writeFileSync(op.file, chunkOrAsset.code)
        }
      }
    }
  }
}


function getEntryFile (f: string) {
  const tsx = '.tsx'
  const jsx = '.jsx'

  if (fs.existsSync(`${f}${tsx}`)) {
    return {
      file: `${f}${tsx}`,
      ext: tsx
    }
  }
  if (fs.existsSync(`${f}${jsx}`)) {
    return {
      file: `${f}${jsx}`,
      ext: jsx
    }
  }
}

export async function buildEntryServer (c: IConfig) {
  const entrySererFile = path.join(c.cwd, c.appDirectory, c.entryServer)

  const r = getEntryFile(entrySererFile)
  
  if (r?.file) {
    const outputFileDir = path.join(c.cwd, c.devCacheDirectory)
    const plugins: Plugin[] = [
      less() as any,
      json(),
      commonjs(),
      resolve({
        extensions: ['.jsx', '.tsx']
      }),
      babel({
        exclude: 'node_modules/**',
        presets: ['@babel/preset-react']
      })
    ]

    const distEntry = path.join(outputFileDir, `${c.entryServer}.js`)

    const inputOptions: IBuildOption = {
      input: {
        external: ['react', 'tarat-core', 'tarat-connect'],
        input: r.file,
        plugins,
      },
      output: [{
        // dir: outputFileDir,
        file: distEntry,
        format: 'esm',
      }],
    }

    console.log('inputOptions: ', inputOptions);
    await build(inputOptions)

    return {
      entry: distEntry
    }
  }
}
