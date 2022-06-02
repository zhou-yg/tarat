import tsPlugin from 'rollup-plugin-typescript2'
import dts from "rollup-plugin-dts"
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json'

export default [
  {
    plugins: [
      json(),
      tsPlugin({
        clean: true,
        tsconfig: './tsconfig.json',
      }),
    ],
    input: 'cli/index.ts',
    output: {
      file: 'dist/cli/index.js',
      format: 'esm'
    }
  },
  {
    plugins: [
      tsPlugin({
        clean: true,
        tsconfig: './tsconfig.json',
      }),
    ],
    input: "src/server.ts",
    output: [
      { file: "dist/server.js", format: "es" }
    ],
  }
]