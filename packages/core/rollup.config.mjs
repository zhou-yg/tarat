import tsPlugin from 'rollup-plugin-typescript2'
import dts from "rollup-plugin-dts"

export default [{
  plugins: [
    tsPlugin({
      clean: true,
      tsconfig: './tsconfig.json',
    })
  ],
  input: 'src/core.ts',
  output: {
    file: 'dist/index.esm.js',
    format: 'esm'
  }
},
  {
    input: "src/core.ts",
    output: [{ file: "dist/index.esm.d.ts", format: "es" }],
    plugins: [dts()],
  }
]