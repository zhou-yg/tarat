import tsPlugin from 'rollup-plugin-typescript2'
import dts from "rollup-plugin-dts"
import replace from '@rollup/plugin-replace';
// import { nodeResolve } from '@rollup/plugin-node-resolve';


function myPlugin () {
  return {
    name: 'clear function',
    transform (code, id) {
      console.log('id: ', id);
      console.log('code: ', code);

      const ast = this.parse(code)
      console.log('ast: ', ast.body[2].declaration.body);
      console.log('ast: ', code.slice(ast.body[2].declaration.body.start, ast.body[2].declaration.body.end));

      const newCode =
        code.slice(0, ast.body[2].declaration.body.start + 1) +
        code.slice(ast.body[2].declaration.body.end - 1)

      return newCode
    }
  }
}

/** @type {import('rollup').RollupOptions} */ 
export default [
  {
    plugins: [
      tsPlugin({
        clean: true,
        tsconfig: './tsconfig.json',
      }),
      // replace({
      // }),
      myPlugin()
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