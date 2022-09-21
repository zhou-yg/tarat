import tsPlugin from 'rollup-plugin-typescript2'
import dts from "rollup-plugin-dts"
import rollupAlias from '@rollup/plugin-alias'
import replace from '@rollup/plugin-replace';
// import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
  {
    plugins: [
      tsPlugin({
        clean: true,
        tsconfig: './tsconfig.json',
      }),
    ],
    input: 'src/index.ts',
    output: {
      file: 'dist/connect.js',
      format: 'commonjs'
    },
  },
  {
    plugins: [
      tsPlugin({
        clean: true,
        tsconfig: './tsconfig.json',
      }),
      // rollupAlias({
      //   entries: {
      //     'tarat/core': '../tarat/core.client.js',
      //   }  
      // })
    ],
    input: 'src/index.ts',
    output: {
      file: 'dist/connect.client.js',
      format: 'esm'
    },
  },
  {
    input: "src/index.ts",
    output: [
      { file: "dist/connect.d.ts", format: "es" }
    ],
    plugins: [
      dts(),
    ],
  }
]