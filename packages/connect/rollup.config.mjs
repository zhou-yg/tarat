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
    ],
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'esm'
    },
  },
  {
    input: "src/index.ts",
    output: [
      { file: "dist/index.d.ts", format: "es" }
    ],
    plugins: [
      dts(),
    ],
  },
  // {
  //   input: "src/driver.ts",
  //   output: [
  //     { file: "dist/driver.d.ts", format: "es" }
  //   ],
  //   plugins: [
  //     dts(),
  //   ],
  // },
  // {
  //   plugins: [
  //     tsPlugin({
  //       clean: true,
  //       tsconfig: './tsconfig.json',
  //     }),
  //   ],
  //   input: 'src/driver.ts',
  //   output: {
  //     file: 'dist/driver.js',
  //     format: 'esm'
  //   },
  // },
]