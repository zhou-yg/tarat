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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const templateFile = './routesTemplate.ejs'
const templateFilePath = path.join(__dirname, templateFile)

const routesTemplate = compile(fs.readFileSync(templateFilePath).toString())


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


function getEntryFile (f: string) {
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

export async function buildRoutes(c: IConfig) {
  const autoGenerateRoutesFile = path.join(c.cwd, c.appDirectory, c.routes)
  const distRoutesFile = path.join(c.cwd, c.devCacheDirectory, `${c.routesServer}.js`)
  const distRoutesFileCss = path.join(c.devCacheDirectory, `${c.routesServer}.css`)

  const ext = '.jsx'

  const routesTreeArr = defineRoutesTree(c.pages)

  const imports = generateRoutesImports(routesTreeArr)
  const importsWithAbsolutePath = imports.map(([n, f]) => {
    return `import ${n} from '${path.join(c.cwd, f)}'`
  }).join('\n')

  const r = generateRoutesContent(routesTreeArr)

  const routeIndex = routesTreeArr.find(r => r.index)
  const index = routeIndex ? `<Route path="/" element={<Index />} />` : ''

  const routesStr = routesTemplate({
    imports: importsWithAbsolutePath,
    index,
    routes: r
  })

  const autoRoutesFile = `${autoGenerateRoutesFile}${ext}`
  fs.writeFileSync(autoRoutesFile, prettier.format(routesStr))

  const inputOptions: IBuildOption = {
    input: {
      external: ['react', 'tarat-core', 'tarat-connect'],
      input: autoRoutesFile,
      plugins: plugins([
        postcss({
          extract: true,
        }),
      ])
    },
    output: [{
      // dir: path.join(c.cwd, c.devCacheDirectory), used when generating multiple chunks
      file: distRoutesFile,
      format: 'esm',
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
  const entryServerFile = path.join(c.cwd, c.appDirectory, c.entryServer)

  const r = getEntryFile(entryServerFile)
  
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
        format: 'esm',

      }],
    }

    await build(c, inputOptions)

    return {
      entry: distEntry,
      css: distEntryCss
    }
  }
}
