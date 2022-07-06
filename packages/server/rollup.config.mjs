import tsPlugin from 'rollup-plugin-typescript2'
import dts from "rollup-plugin-dts"
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json'
import commonjs from "@rollup/plugin-commonjs";

export default [
  {
    plugins: [
      json(),
      tsPlugin({
        clean: true,
        tsconfig: './tsconfig.json',
      }),
      commonjs(),
    ],
    input: 'cli/index.ts',
    output: {
      file: 'dist/cli/index.js',
      format: 'umd'
    }
  },
  // {
  //   plugins: [
  //     tsPlugin({
  //       clean: true,
  //       tsconfig: './tsconfig.json',
  //     }),
  //     commonjs(),
  //   ],
  //   input: "src/index.ts",
  //   output: [
  //     { file: "dist/index.js", format: "es" }
  //   ],
  // },
  {
    plugins: [
      dts()
    ],
    input: "src/index.ts",
    output: [
      { file: "dist/index.d.ts", format: "es" }
    ],
  }
]