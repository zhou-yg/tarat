import tsPlugin from 'rollup-plugin-typescript2'
import dts from "rollup-plugin-dts"

const base = {
  plugins: [
    tsPlugin({
      clean: true,
      tsconfig: './tsconfig.json',
    }),
  ],
  input: 'src/index.ts',
  external: ['react', 'tarat/core', 'swr'],
}

export default [
  {
    ...base,
    output: {
      file: 'dist/connect.js',
      format: 'commonjs'
    },
  },
  {
    ...base,
    output: {
      file: 'dist/connect.esm.js',
      format: 'esm'
    },
  },
  {
    ...base,
    output: {
      file: 'dist/connect.client.esm.js',
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