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
      file: 'dist/index.server.js',
      name: 'taratCore',
      format: 'umd'
    },
  },
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
      file: 'dist/index.server.mjs',
      format: 'esm'
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
      file: 'dist/index.client.js',
      format: 'esm'
    }
  },
  {
    input: "src/index.ts",
    output: [
      { file: "dist/index.d.ts", format: "es" }
    ],
    plugins: [
      dts(),
    ],
  }
]