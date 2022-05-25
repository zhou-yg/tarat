import { execa } from 'execa'

async function build () {

  await execa(
    'npx',
    'rollup',
    [
      '-c',
      '--environment',
      [
        // `COMMIT:${commit}`,
        `NODE_ENV:production`,
        // `TARGET:${target}`,
        `FORMATS:${[
          "esm-bundler",
          "esm-browser",
          "cjs",
          "global"
        ]}`,
        `TYPES:true`,
      ]
        .filter(Boolean)
        .join(',')
    ],
    {
    }
  )
}

build()