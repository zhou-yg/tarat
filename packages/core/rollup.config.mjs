import tsPlugin from 'rollup-plugin-typescript2'
import dts from "rollup-plugin-dts"
import replace from 'rollup-plugin-replace';

export default [
  {
    plugins: [
      tsPlugin({
        clean: true,
        tsconfig: './tsconfig.json',
      }),
      replace({
        'process.env.TARGET': '"server"'
      })
    ],
    input: 'src/core.ts',
    output: {
      file: 'dist/index.server.js',
      format: 'esm'
    }
  },
  {
    plugins: [
      tsPlugin({
        clean: true,
        tsconfig: './tsconfig.json',
      }),
      replace({
        'process.env.TARGET': '"client"'
      })
    ],
    input: 'src/core.ts',
    output: {
      file: 'dist/index.client.js',
      format: 'esm'
    }
  },
  {
    input: "src/core.ts",
    output: [
      { file: "dist/index.d.ts", format: "es" }
    ],
    plugins: [dts()],
  }
]