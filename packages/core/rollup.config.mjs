import tsPlugin from 'rollup-plugin-typescript2'
import dts from "rollup-plugin-dts"
import replace from '@rollup/plugin-replace';
// import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
  {
    plugins: [
      tsPlugin({
        clean: true,
        tsconfig: './tsconfig.json',
      }),
      replace({
        'process.env.TARGET': '"server"'
      }),
    ],
    input: 'src/index.ts',
    output: {
      file: 'dist/core.js',
      format: 'commonjs'
    },
  },
  {
    plugins: [
      tsPlugin({
        clean: true,
        tsconfig: './tsconfig.json',
      }),
      replace({
        'process.env.TARGET': '"client"'
      }),
    ],
    input: 'src/index.ts',
    output: {
      file: 'dist/core.client.js',
      format: 'esm'
    }
  },
  {
    input: "src/index.ts",
    output: [
      { file: "dist/core.client.d.ts", format: "es" },
      { file: "dist/core.d.ts", format: "es" },
    ],
    plugins: [
      dts(),
    ],
  }
]