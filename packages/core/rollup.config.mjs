import tsPlugin from '@rollup/plugin-typescript'

export default {
  plugins: [
    tsPlugin()
  ],
  input: 'src/core.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'esm'
  }
}