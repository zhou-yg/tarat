import { IConfig, IViewConfig } from "../config";
import * as fs from 'fs'
import * as path from 'path'
import { compile } from 'ejs'
import { InputOptions, ModuleFormat, OutputOptions, Plugin, rollup, RollupBuild } from 'rollup' 
import resolve from '@rollup/plugin-node-resolve';
import { babel  } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json'
import commonjs from "@rollup/plugin-commonjs";
import postcss from 'rollup-plugin-postcss'
import tsPlugin from 'rollup-plugin-typescript2'
import * as prettier from 'prettier'
import * as esbuild from 'esbuild';
import { defineRoutesTree, IRouteChild } from "../config/routes";
import autoExternal from 'rollup-plugin-auto-external';
 
const templateFile = './routesTemplate.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const templateClientFile = './routesClientTemplate.ejs'
const templateClientFilePath = path.join(__dirname, templateClientFile)

const defaultTsconfigJSON = path.join(__dirname, './defaultTsconfig.json')

const routesTemplate = compile(fs.readFileSync(templateFilePath).toString())
const routesClientTemplate = compile(fs.readFileSync(templateClientFilePath).toString())


export interface IBuildOption {
  input: InputOptions
  output: OutputOptions
}

/**
 * searches for tsconfig.json file starting in the current directory, if not found
 * use the default tsconfig.json provide by tarat
 */
export function getTsconfig (c: IConfig) {
  const tsconfigFile = path.join(c.cwd, 'tsconfig.json')
  if (fs.existsSync(tsconfigFile)) {
    return tsconfigFile
  }
  console.log(`[esbuildHooks] using default tsconfig setting: ${defaultTsconfigJSON}`)
  return defaultTsconfigJSON
}

export async function build (c: IConfig, op: IBuildOption) {

  let bundle: RollupBuild | undefined
  try {
    bundle = await rollup(op.input)
    await generateOutput(c, bundle, op.output)
  } catch (e) {
    console.error(e)
  } finally {
    await bundle?.close()
  }
}

async function generateOutput(c: IConfig, bundle: RollupBuild, op: IBuildOption['output']) {
  const { output } = await bundle.generate(op)
  for (const chunkOrAsset of output) {

    if (chunkOrAsset.type === 'asset') {
      const target = path.join(op.dir || c.pointFiles.outputDir, chunkOrAsset.fileName)
      fs.writeFileSync(target, chunkOrAsset.source)

    } else if (chunkOrAsset.type === 'chunk') {
      let dir = op.dir
      if (!op.dir) {
        dir = op.file?.replace(chunkOrAsset.fileName, '')
      }
      if (dir && !fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      if (op.file) {
        fs.writeFileSync(op.file, chunkOrAsset.code)
      } else {
        fs.writeFileSync(path.join(dir!, chunkOrAsset.fileName), chunkOrAsset.code)
      }
    }
  }
}



export function getPlugins (input: {
  css: string | boolean,
  mode: 'dev' | 'build'
}, c: IConfig) {
  const { css, mode } = input

  const plugins = [
    json(),
    commonjs(),
    resolve({
      extensions: ['.jsx', '.tsx']
    }),
    babel({
      exclude: 'node_modules/**',
      presets: ['@babel/preset-react']
    }),
    postcss({
      extract: typeof css === 'string'  ? css.replace(c.pointFiles.outputDir, '').replace(/^\//, '') : css, // only support relative path
    }),
    autoExternal({
      peerDependencies: true,
      dependencies: mode === 'dev'
    }),
    c.ts ? tsPlugin({
      clean: true,
      tsconfig: getTsconfig(c)
    }) : undefined,
  ].filter(Boolean)

  return plugins as Plugin[]
}


function getEntryFile (c: IConfig) {
  let f = path.join(c.cwd, c.appDirectory, c.entryServer)

  const tsx = '.tsx'
  const jsx = '.jsx'

  if (c.ts && fs.existsSync(`${f}${tsx}`)) {
    return {
      file: `${f}${tsx}`,
      ext: tsx
    }
  }
  if (!c.ts && fs.existsSync(`${f}${jsx}`)) {
    return {
      file: `${f}${jsx}`,
      ext: jsx
    }
  }
}
function upperFirst (s: string) {
  s = s.replace(/\:/g, '_')
  return s ? (s[0].toUpperCase() + s.substring(1)) : ''
}

export const externals = ['react', 'react-dom', 'tarat-core', 'tarat-connect', 'react-router-dom', 'antd']

function generateRoutesContent (routes: IRouteChild[], depth = 0, parentNmae = ''): string {
  const pathObj: { [p: string]: IRouteChild } = {}
  routes.forEach(r => {
    if (pathObj[r.path]) {
      const exist = pathObj[r.path]
      if (exist.dir) {
        Object.assign(exist, {
          dir: false,
          file: r.file,
          id: r.id
        })
      } else {
        Object.assign(exist, {
          dir: false,
          children: r.children
        })
      }
    } else {
      pathObj[r.path] = Object.assign({}, r)
    }
  })


  const routeArr = Object.values(pathObj).map((r, i) => {
    let Cpt = ''
    let element = ''

    if (r.dir) {
    } else {
      if (r.file) {
        Cpt = `${upperFirst(parentNmae)}${upperFirst(r.name)}`
      } else {
        const childIndex = r.children.find(c => c.index)
        Cpt = childIndex ? `${upperFirst(parentNmae)}${upperFirst(r.name) || '/'}${upperFirst(childIndex.name)}` : ''
      }
      if (Cpt) {
        element = `element={<${Cpt} />}`
      }
    }

    return [
      r.index ? `<Route index ${element} >` : `<Route path="${r.name}" ${element} >`,
      r.children.length > 0 ? generateRoutesContent(r.children, depth + 1, r.name) : '',
      `</Route>`
    ].join('\n');
  })

  return routeArr.join('\n')
}

function generateRoutesImports (routes: IRouteChild[], parentNmae = '') {
  let importsArr: [string, string][] = []
  routes.forEach(r => {
    if (!r.dir && r.file) {
      importsArr.push([
        `${upperFirst(parentNmae)}${upperFirst(r.name)}`,
        r.file,
      ])
    }
    if (r.children) {
      const childImports = generateRoutesImports(r.children, r.name)
      importsArr.push(...childImports)
    }
  })

  return importsArr
}

function implicitImportPath (path: string, ts: boolean) {
  if (ts) {
    return path.replace(/\.ts(x?)$/, '')
  }

  return path
}

export async function buildRoutes(c: IConfig) {

  const {
    outputDir,
    autoGenerateServerRoutes,
    distServerRoutes,
    autoGenerateClientRoutes,
    outputAppServerDir,
    distServerRoutesCSS
  } = c.pointFiles

  const routesTreeArr = defineRoutesTree(c.pages)

  const imports = generateRoutesImports(routesTreeArr)

  const importsWithAbsolutePathClient = imports.map(([n, f]) => {
    return `import ${n} from '${implicitImportPath(path.join(c.cwd, f), c.ts)}'`
  }).join('\n')
  const importsWithAbsolutePathServer = imports.map(([n, f]) => {
    return `import ${n} from '${implicitImportPath(path.join(c.cwd, f), c.ts)}'`
  }).join('\n')

  const includingTs = imports.some(([n, f]) => /\.ts(x?)$/.test(f))
  if (includingTs && !c.ts) {
    throw new Error('[tarat] you are using ts file. please specific ts:true in tarat.config.js')
  }

  const r = generateRoutesContent(routesTreeArr)

  // const routeIndex = routesTreeArr.find(r => r.index)
  // const index = routeIndex ? `<Route path="/" element={<Index />} />` : ''
  const index = ''

  const routesStr = routesTemplate({
    imports: importsWithAbsolutePathServer,
    index,
    routes: r
  })
  fs.writeFileSync(autoGenerateServerRoutes, prettier.format(routesStr))

  const routesStr2 = routesClientTemplate({
    imports: importsWithAbsolutePathClient,
    index,
    routes: r
  })
  // generate for vite.js
  fs.writeFileSync(autoGenerateClientRoutes, prettier.format(routesStr2))

  const myPlugins = getPlugins({
    css: distServerRoutesCSS,
    mode: 'dev'
  }, c)
  /**
   * compile routes.server to js
   * routes.client doesnt need becase of vite
   */
  const inputOptions: IBuildOption = {
    input: {
      cache: false,
      input: autoGenerateServerRoutes,
      plugins: myPlugins
    },
    output: {
      file: distServerRoutes,
      format: 'commonjs',
    }
  }

  await build(c, inputOptions)  
}

export async function buildEntryServer (c: IConfig) {

  const r = getEntryFile(c)
  
  if (r?.file) {
    const { distEntryJS: distEntry, distEntryCSS: distEntryCss }  = c.pointFiles

    const inputOptions: IBuildOption = {
      input: {
        input: r.file,
        plugins: getPlugins({
          mode: 'dev',
          css: distEntryCss
        }, c),
      },
      output: {
        file: distEntry,
        format: 'commonjs',

      },
    }

    await build(c, inputOptions)

    return {
      entry: distEntry,
      css: distEntryCss
    }
  }
}

async function esbuildHooks (c: IConfig, outputDir: string, format?: esbuild.Format) {
  const { hooks } = c
  let includingTs = false
  const points: string[] = []
  hooks.map(h => {
    const { filePath, name } = h
    if (/\.(m)?(j|t)s$/.test(filePath)) {
      points.push(filePath)

      includingTs = /\.ts(x)?$/.test(filePath) || includingTs
    }
  })

  if (includingTs && !c.ts) {
    throw new Error('[tarat] you are using ts file. please specific ts:true in tarat.config.js')
  }

  const buildOptions: esbuild.BuildOptions = {
    entryPoints: points,
    bundle: false,
    outdir: outputDir,
    platform: 'node',
    format,
  }

  // check tsconfig
  if (includingTs) {
    buildOptions.tsconfig = getTsconfig(c)
  }

  await esbuild.build(buildOptions)
}

/**
 * for server side running
 */
export async function buildHooks (c: IConfig) {
  const { outputHooksESMDir, outputHooksDir  } = c.pointFiles

  await Promise.all([
    esbuildHooks(c, outputHooksDir, 'cjs'),
    esbuildHooks(c, outputHooksESMDir, 'esm'),
  ])
}

