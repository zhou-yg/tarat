import { IConfig, IViewConfig } from "../config";
import * as fs from 'fs'
import * as path from 'path'
import { compile } from 'ejs'
import { fileURLToPath } from 'url'
import { InputOptions, ModuleFormat, OutputOptions, Plugin, rollup, RollupBuild } from 'rollup' 
import resolve from '@rollup/plugin-node-resolve';
import { babel  } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json'
import commonjs from "@rollup/plugin-commonjs";
import postcss from 'rollup-plugin-postcss'
import tsPlugin from 'rollup-plugin-typescript2'
import * as prettier from 'prettier'
import * as esbuild from 'esbuild';
import { loadJSON } from "../util";

const templateFile = './routesTemplate.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const templateClientFile = './routesClientTemplate.ejs'
const templateClientFilePath = path.join(__dirname, templateClientFile)

const defaultTsconfigJSON = path.join(__dirname, './defaultTsconfig.json')

const routesTemplate = compile(fs.readFileSync(templateFilePath).toString())
const routesClientTemplate = compile(fs.readFileSync(templateClientFilePath).toString())


interface IBuildOption {
  input: InputOptions
  output: OutputOptions[]
}

/**
 * searches for tsconfig.json file starting in the current directory, if not found
 * use the default tsconfig.json provide by tarat
 */
function getTsconfig (c: IConfig) {
  const tsconfigFile = path.join(c.cwd, 'tsconfig.json')
  if (fs.existsSync(tsconfigFile)) {
    return tsconfigFile
  }
  console.log(`[esbuildHooks] using default tsconfig setting: ${defaultTsconfigJSON}`)
  return defaultTsconfigJSON
}

async function build (c: IConfig, op: IBuildOption) {

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

async function generateOutput(c: IConfig, bundle: RollupBuild, o: IBuildOption['output']) {
  for (const op of o) {
    const { output } = await bundle.generate(op)
    for (const chunkOrAsset of output) {
      if (chunkOrAsset.type === 'asset') {
        const target = path.join(c.cwd, c.devCacheDirectory, chunkOrAsset.fileName)
        fs.writeFileSync(target, chunkOrAsset.source)

      } else if (chunkOrAsset.type === 'chunk') {
        const dir = op.file?.replace(chunkOrAsset.fileName, '')
        if (dir && !fs.existsSync(dir)) {
          fs.mkdirSync(dir)
        }
        if (op.file) {
          fs.writeFileSync(op.file, chunkOrAsset.code)
        }
      }
    }
  }
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

interface IRouteChild extends IViewConfig {
  children: IRouteChild[]
}

interface IRoutesTree {
  [k: string]: IRouteChild
}

function defineRoutesTree (pages: IConfig['pages']) {
  const routesMap: IRoutesTree = {}
  pages.forEach(p => {
    routesMap[p.id] = Object.assign({
      children: []
    }, p)
  })

  pages.forEach(p => {
    if (p.parentId) {
      if (!routesMap[p.parentId]) {
        routesMap[p.parentId] = {
          path: p.parentId,
          file: '',
          name: p.parentId.replace(/^\//, ''),
          parentId: '',
          id: p.parentId,
          children: []
        }
      }
      const child = routesMap[p.id]
      routesMap[p.parentId].children.push(child)
    }
  })

  return Object.values(routesMap).filter(p => !p.parentId)
}

function upperFirst (s: string) {
  return s ? (s[0].toUpperCase() + s.substring(1)) : ''
}

function generateRoutesContent (routes: IRouteChild[], depth = 0, parentNmae = ''): string {
  const routeArr = routes.map((r, i) => {
    let Cpt = ''
    if (r.file) {
      Cpt = `${upperFirst(parentNmae)}${upperFirst(r.name)}`
    } else {
      const childIndex = r.children.find(c => c.index)
      Cpt = childIndex ? `${upperFirst(parentNmae)}${upperFirst(r.name) || '/'}${upperFirst(childIndex.name)}` : ''
    }
    let element = ''
    if (Cpt) {
      element = `element={<${Cpt} />}`
    }

    return [
      `<Route path="${r.name}" ${element} >`,
      r.children.length > 0 ? generateRoutesContent(r.children, depth + 1, r.name) : '',
      `</Route>`
    ].map(s => `${new Array(depth * 2).fill(' ').join('')}${s}`).join('\n');
  })

  return routeArr.join('\n')
}

function generateRoutesImports (routes: IRouteChild[], parentNmae = '') {
  let importsArr: [string, string][] = []
  routes.forEach(r => {
    if (r.file) {
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
    autoGenerateRoutesFile,
    autoGenerateRoutesClientFile,
    distRoutesFile,
    distRoutesFileCSS } = c.pointFiles

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

  const routeIndex = routesTreeArr.find(r => r.index)
  const index = routeIndex ? `<Route path="/" element={<Index />} />` : ''

  const routesStr = routesTemplate({
    imports: importsWithAbsolutePathServer,
    index,
    routes: r
  })
  fs.writeFileSync(autoGenerateRoutesFile, prettier.format(routesStr))

  const routesStr2 = routesClientTemplate({
    imports: importsWithAbsolutePathClient,
    index,
    routes: r
  })
  // generate for vite.js
  fs.writeFileSync(autoGenerateRoutesClientFile, prettier.format(routesStr2))

  const myPlugins = plugins([
    postcss({
      extract: true,
    }),
    c.ts ? tsPlugin({ clean: true, tsconfig: getTsconfig(c) }) : undefined,
  ])
  // compilet to js
  const inputOptions: IBuildOption = {
    input: {
      external: ['react', 'tarat-core', 'tarat-connect', 'react-router-dom'],
      input: autoGenerateRoutesFile,
      plugins: myPlugins
    },
    output: [{
      file: distRoutesFile,
      format: 'commonjs',
    }]
  }

  await build(c, inputOptions)

  return {
    routesEntry: distRoutesFile,
    css: distRoutesFileCSS
  }
}

const plugins: (arr: (Plugin | undefined)[]) => Plugin[] = (arr: (Plugin | undefined)[]) => ([
  ...arr,
  json(),
  commonjs(),
  resolve({
    extensions: ['.jsx', '.tsx']
  }),
  babel({
    exclude: 'node_modules/**',
    presets: ['@babel/preset-react']
  })
].filter(Boolean) as Plugin[])

export async function buildEntryServer (c: IConfig) {

  const r = getEntryFile(c)
  
  if (r?.file) {
    const { distEntryJS: distEntry, distEntryCSS: distEntryCss }  = c.pointFiles

    const inputOptions: IBuildOption = {
      input: {
        external: ['react', 'tarat-core', 'tarat-connect'],
        input: r.file,
        plugins: plugins([
          postcss({
            extract: true,
          }),  
        ]),
      },
      output: [{
        // dir: outputFileDir,
        file: distEntry,
        format: 'commonjs',

      }],
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
  const { devHooksESMDir, devHooksDir  } = c.pointFiles

  await Promise.all([
    esbuildHooks(c, devHooksDir, 'cjs'),
    esbuildHooks(c, devHooksESMDir, 'esm'),
  ])
}

