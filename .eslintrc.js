const DOMGlobals = ['window', 'document']
const NodeGlobals = ['module', 'require']

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module'
  },
  plugins: ["jest"],
  rules: {
    'no-debugger': 'error',
    // most of the codebase are expected to be env agnostic
    'no-restricted-globals': ['error', ...DOMGlobals, ...NodeGlobals],
    // since we target ES2015 for baseline support, we need to forbid object
    // rest spread usage in destructure as it compiles into a verbose helper.
    // TS now compiles assignment spread into Object.assign() calls so that
    // is allowed.
    'no-restricted-syntax': [
      'error',
      'ObjectPattern > RestElement',
      'AwaitExpression'
    ]
  },
}