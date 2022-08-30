import tsPlugin from 'rollup-plugin-typescript2'
import dts from "rollup-plugin-dts"
import replace from '@rollup/plugin-replace';
// import { nodeResolve } from '@rollup/plugin-node-resolve';

/** @type {import('rollup').RollupOptions} */ 
export default [
  {
    plugins: [
      tsPlugin({
        clean: true,
        tsconfig: './tsconfig.json',
      }),
      replace({
      }),
    ],
    treeshake: {
      moduleSideEffects: false
    },
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es'
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