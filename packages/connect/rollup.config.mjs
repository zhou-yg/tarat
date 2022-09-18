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
      file: 'dist/connect.js',
      name: 'taratConnect',
      format: 'umd'
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