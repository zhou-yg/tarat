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
import * as prettier from 'prettier'
import * as esbuild from 'esbuild';
import { loadJSON } from "../util";

const templateFile = './routesTemplate.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const templateClientFile = './routesClientTemplate.ejs'
const templateClientFilePath = path.join(__dirname, templateClientFile)

const defaultTsconfigJSON = path.join(__dirname, './defaultTsconfig.json')

const defaultEntryServer = path.join(__dirname, './defaultEntryServer.jsx')

const routesTemplate = compile(fs.readFileSync(templateFilePath).toString())
const routesClientTemplate = compile(fs.readFileSync(templateClientFilePath).toString())


interface IBuildOption {
  input: InputOptions
  output: OutputOptions[]
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

  if (fs.existsSync(`${f}${tsx}`)) {
    return {
      file: `${f}${tsx}`,
      ext: tsx
    }
  }
  if (fs.existsSync(`${f}${jsx}`)) {
    return {
      file: `${f}${jsx}`,
      ext: jsx
    }
  }

  return {
    file: defaultEntryServer,
    ext: jsx
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
      `<Route path="/${r.name}" ${element} >`,
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

export async function buildRoutes(c: IConfig) {
  const ext = c.ext

  const autoGenerateRoutesFile = path.join(c.cwd, c.devCacheDirectory, `${c.routesServer}${ext}`)
  const autoGenerateRoutesClientFile = path.join(c.cwd, c.devCacheDirectory, `${c.routes}${ext}`)
  const distRoutesFile = path.join(c.cwd, c.devCacheDirectory, `${c.routesServer}.js`)
  const distRoutesFileCss = path.join(c.devCacheDirectory, `${c.routesServer}.css`)


  const routesTreeArr = defineRoutesTree(c.pages)

  const imports = generateRoutesImports(routesTreeArr)
  const importsWithAbsolutePathClient = imports.map(([n, f]) => {
    return `import ${n} from '${path.join(c.cwd, f)}'`
  }).join('\n')
  const importsWithAbsolutePathServer = imports.map(([n, f]) => {
    return `import ${n} from '${path.join(c.cwd, f)}'`
  }).join('\n')

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

  // compilet to js
  const inputOptions: IBuildOption = {
    input: {
      external: ['react', 'tarat-core', 'tarat-connect'],
      input: autoGenerateRoutesFile,
      plugins: plugins([
        postcss({
          extract: true,
        }),
      ])
    },
    output: [{
      // dir: path.join(c.cwd, c.devCacheDirectory), used when generating multiple chunks
      file: distRoutesFile,
      format: 'commonjs',
    }]
  }

  await build(c, inputOptions)

  return {
    routesEntry: distRoutesFile,
    css: path.join(c.cwd, distRoutesFileCss)
  }
}

const plugins: (arr: Plugin[]) => Plugin[] = (arr: Plugin[]) => ([
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
])

export async function buildEntryServer (c: IConfig) {

  const r = getEntryFile(c)
  
  if (r?.file) {
    const outputFileDir = path.join(c.cwd, c.devCacheDirectory)

    const distEntry = path.join(outputFileDir, `${c.entryServer}.js`)
    const distEntryCss = path.join(outputFileDir, `${c.entryServer}.css`)

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

async function esbuildHooks (c: IConfig, outputDir: string) {
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

  const buildOptions: esbuild.BuildOptions = {
    entryPoints: points,
    // outbase: dir,
    bundle: false,
    outdir: outputDir,
    platform: 'node',
    format: 'cjs',
  }

  // check tsconfig
  if (includingTs) {
    const tsconfigFile = path.join(c.cwd, 'tsconfig.json')
    let json = {}
    if (fs.existsSync(tsconfigFile)) {
      buildOptions.tsconfig = tsconfigFile
    } else {
      console.log(`[esbuildHooks] using default tsconfig setting: ${defaultTsconfigJSON}`)
      buildOptions.tsconfig = defaultTsconfigJSON
    }
  }

  await esbuild.build(buildOptions)
}

export async function buildHooks (c: IConfig) {
  const esbuildOutputDir = path.join(c.cwd, c.devCacheDirectory, c.hooksDirectory)

  await esbuildHooks(c, esbuildOutputDir)

  return {
    entryHooksDir: esbuildOutputDir
  }
}
