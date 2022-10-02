import * as prismaInternals from '@prisma/internals'
import acorn, { parse as acornParse } from 'acorn'
import { hookFactoryFeatures, set } from 'tarat/core'
import * as walk from 'acorn-walk'
import { IConfig, IViewConfig } from "../config";
import * as fs from 'fs'
import * as path from 'path'
import { compile, name } from 'ejs'
import { AcornNode, InputOptions, ModuleFormat, OutputOptions, Plugin, rollup, RollupBuild } from 'rollup' 
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
import replace from '@rollup/plugin-replace';
import rollupAlias from '@rollup/plugin-alias'
import dts from "rollup-plugin-dts"
import { emptyDirectory, loadJSON, logFrame, lowerFirst, traverseDir } from "../util";
import chalk from "chalk";
import { cp, mkdir, rm } from "shelljs";
import { ArrowFunctionExpression, CallExpression, FunctionExpression, Identifier, ImportDeclaration, Program } from 'estree';
import { traverse, last } from '../util';
import aliasDriverRollupPlugin from './plugins/rollup-plugin-alias-driver';
import { removeFunctionBody } from './ast';
import esbuildAliasPlugin from 'esbuild-plugin-alias';
import { findDependentPrisma, readCurrentPrisma, readExsitPrismaPart, transformModelName } from './compose';
import { upperFirst } from 'lodash';

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
export function getTSConfigPath (cwd: string) {
  const tsconfigFile = path.join(cwd, 'tsconfig.json')
  if (fs.existsSync(tsconfigFile)) {
    return tsconfigFile
  }
  console.log(`[getTSConfigPath] using default tsconfig setting: ${defaultTsconfigJSON}`)
  return defaultTsconfigJSON
}

function getPostCssConfigPath (c: IConfig) {
  let pp = ''
  fs.readdirSync(c.cwd).forEach(f => {
    if (/postcss\.config/.test(f)) {
      if (pp) {
        throw new Error(`[getPostCssConfigPath] duplcate postcsss.config file exist in ${c.cwd}`)
      } else {
        pp = path.join(c.cwd, f)
      }
    }
  })
  if (pp && fs.existsSync(pp)) {
    return pp
  }
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
  mode: 'dev' | 'build',
  target?: 'browser' | 'node' | 'unit',
  alias?: { [k: string]: string },
  runtime?: 'server' | 'client'
}, c: IConfig) {
  const { runtime, alias, css, mode, target = 'node' } = input
  const plugins = [
    runtime ? aliasDriverRollupPlugin(c, runtime) : undefined,
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': mode === 'build' ? '"production"' : '"development"'
    }),
    rollupAlias({
      entries: {
        '@': c.cwd,
        ...(alias || {}),
      }
    }),
    json(),
    commonjs(),
    resolve({
      browser: target === 'browser',
      extensions: ['.jsx', '.tsx', '.js', '.cjs', '.mjs', '.ts', '.json']
    }),
    babel({
      exclude: 'node_modules/**',
      presets: ['@babel/preset-react']
    }),
    postcss({
      config: {
        path: getPostCssConfigPath(c),
        ctx: {}
      },
      extract: typeof css === 'string'  ? css.replace(c.pointFiles.outputDir, '').replace(/^\//, '') : css, // only support relative path
    }),
    autoExternal({
      peerDependencies: target !== 'browser', // only under browser need bundle all dependencies
      dependencies: mode === 'dev' && target !== 'browser'
    }),
    c.ts ? tsPlugin({
      clean: true,
      tsconfig: getTSConfigPath(c.cwd)
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

function getAppRootFile (c: IConfig) {
  let f = path.join(c.cwd, c.appDirectory, c.appRoot)

  const tsx = '.tsx'
  const jsx = '.jsx'

  if (c.ts && fs.existsSync(`${f}${tsx}`)) {
    return {
      file: `${f}${tsx}`,
      path: f,
      name: c.appRoot,
      ext: tsx
    }
  }
  if (!c.ts && fs.existsSync(`${f}${jsx}`)) {
    return {
      file: `${f}${jsx}`,
      path: f,
      name: c.appRoot,
      ext: jsx
    }
  }
}

function upperFirstVariable (s: string = '') {
  s = s.replace(/\:|-/g, '_').replace(/^_/, '')
  return s ? (s[0].toUpperCase() + s.substring(1)) : ''
}

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
        Cpt = `${upperFirstVariable(parentNmae)}${upperFirstVariable(r.name)}`
      } else {
        const childIndex = r.children.find(c => c.index)
        Cpt = childIndex ? `${upperFirstVariable(parentNmae)}${upperFirstVariable(r.name) || '/'}${upperFirstVariable(childIndex.name)}` : ''
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
        `${upperFirstVariable(parentNmae)}${upperFirstVariable(r.name)}`,
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

export async function buildServerRoutes(c: IConfig) {

  const {
    outputDir,
    autoGenerateServerRoutes,
    distServerRoutes,
    autoGenerateClientRoutes,
    outputAppServerDir,
    distServerRoutesCSS
  } = c.pointFiles

  const appRootFile = getAppRootFile(c)

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
    throw new Error('[tarat] you are using ts file. please specific "ts:true" in tarat.config.js')
  }

  const r = generateRoutesContent(routesTreeArr)

  let entryCSSPath = ''
  if (c.entryCSS) {
    entryCSSPath = `import "${c.entryCSS}"`
  }

  const rootName = upperFirstVariable(appRootFile?.name)

  const rootAppInfo = {
    rootPath: appRootFile?.path,
    rootName,
    rootStart: appRootFile?.name ? `<${rootName}>` : '',
    rootEnd: appRootFile?.name ? `</${rootName}>` : ''
  }

  const moldeIndexesJSON = path.join(c.cwd, c.modelsDirectory, c.schemaIndexes)

  const routesStr = routesTemplate({
    ...rootAppInfo,
    imports: importsWithAbsolutePathServer,
    entryCSSPath,
    routes: r,
    modelIndexes: fs.readFileSync(moldeIndexesJSON).toString()
  })
  fs.writeFileSync(autoGenerateServerRoutes, prettier.format(routesStr))

  const routesStr2 = routesClientTemplate({
    ...rootAppInfo,
    imports: importsWithAbsolutePathClient,
    routes: r
  })
  // generate for vite.js so that this file doesn't need to be compiled to js
  fs.writeFileSync(autoGenerateClientRoutes, prettier.format(routesStr2))

  const myPlugins = getPlugins({
    css: distServerRoutesCSS,
    mode: 'dev',
    runtime: 'server'
  }, c)
  /**
   * compile routes.server to js
   * routes.client doesnt need becase of vite
   */
  const inputOptions: IBuildOption = {
    input: {
      cache: false,
      input: autoGenerateServerRoutes,
      plugins: myPlugins,
      external: ['tarat/core', 'tarat/connect']
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
          css: distEntryCss,
          runtime: 'server'
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

/**
 * make sure hook will import the same module type and same envirnment (eg. client or server)
 */
export function replaceImportDriverPath (
  sourceFile: string,
  format: esbuild.Format,
  env: 'client' | 'server',
) {
  const reg = /from (?:'|")([\w\/-]*)(?:'|")/g
  const reg2 = /require\((?:'|")([\w\/-]*)(?:'|")/g

  const code = fs.readFileSync(sourceFile).toString()
  const r = code.match(reg)
  const r2 = code.match(reg2)
  const importModules = r || r2

  if (
    importModules && importModules.length > 0 &&
    importModules.some(m => /\/drivers\/[\w-]+/.test(m)) &&
    !importModules.some(m => /(client|server)\/drivers\//.test(m))
  ) {  
    const c2 = code.replace(/\/(drivers)\/([\w-]+)/, `/${env}/$1/${format}/$2`)
    fs.writeFileSync(sourceFile, c2)
  }
}

/**
 * under ESM remove all unused imports and directly import
 * ```
 * import 'foo'
 * import XX from 'foo'
 * import XX, { a } from 'foo'
 * import { a } from 'foo'
 * import * as XX from 'foo'
 * ```
 * @param sourceFile 
 */
export function removeUnusedImports(sourceFile: string) {
  const code = fs.readFileSync(sourceFile).toString()

  let ast: ReturnType<typeof acornParse>
  try {
    ast = acornParse(code, { sourceType: 'module', ecmaVersion: 'latest' });
  } catch (e) {
    console.error(`[removeUnusedImports] acorn parse error in ${sourceFile}:`, e)
    return
  }
  const removeImportRange: [number, number][] = []
  if (ast.type === 'Program') {
    ast.body.forEach((n) => {
      switch (n.type) {
        case 'ImportDeclaration':
          {
            const w2 = n.specifiers.map(s => s.local.name)
            let r = false
            walk.simple(ast as any, {
              Identifier (n: any) {
                r = r || w2.includes((n as Identifier).name)
              },
              ExportNamedDeclaration (n: any) {
                traverse(n, (pathArr: string[], value: Identifier) => {
                  if (value.type === 'Identifier' && last(pathArr) === 'local') {
                    r = r || w2.includes(value.name)
                  }
                })    
              }
            })
            if (!r) {
              removeImportRange.push([n.start, n.end])
            }  
          }
          break
      }
    })
  }

  let gap = 0
  let newCode = code
  removeImportRange.forEach(([st, ed]) => {
    newCode = 
      newCode.substring(0, st - gap) + 
      newCode.substring(ed - gap);
    gap += ed - st
  })

  fs.writeFileSync(sourceFile, newCode)
}

function clearFunctionBodyEsbuildPlugin (dir: string, names: string[]): esbuild.Plugin {
  !fs.existsSync(dir) && mkdir(dir)

  return {
    name: 'clear tarat runtime function body',
    setup(build) {
      /** @TODO should match more explicit */
      build.onResolve({ filter: /drivers\// }, args => {
        if (!fs.existsSync(args.path)) {
          return null
        }

        const { base } = path.parse(args.path)
        
        const code = fs.readFileSync(args.path).toString()
        const newCode2 = removeFunctionBody(code, names)

        const destFile = path.join(dir, base)

        fs.writeFileSync(destFile, newCode2)

        return {
          path: destFile,
          sideEffects: false
        }
      })

      // build.onLoad({ filter: /drivers\// }, args => {
      //   console.log('args: ', args);
      //   const code = fs.readFileSync(args.path).toString()

      //   const newCode2 = removeFunctionBody(code, names)
      //   console.log('newCode2: ', newCode2);

      //   return {
      //     contents: newCode2,
      //     loader: /\.ts$/.test(args.path) ? 'ts' : 'js'
      //   }
      // })
    },
  }
}

export function aliasAtCodeToCwd (cwd: string): esbuild.Plugin {
  return {
    name: 'aliasAtCodeToCwd',
    setup(build) {
      build.onLoad({ filter: /drivers\// }, args => {
        const code = fs.readFileSync(args.path).toString()
        const newCode2 = code.replace(/@\//, cwd + '/')
        return {
          contents: newCode2,
          loader: /\.ts$/.test(args.path) ? 'ts' : 'js'
        }
      });
    },
  };
};

async function esbuildDrivers (
  config: IConfig,
  outputDir: string, 
  format: esbuild.Format,
  env?: 'client' | 'server',
) {
  const { drivers, ts, pacakgeJSON, cwd, pointFiles } = config
  let includingTs = false
  const points: string[] = []
  drivers.map(h => {
    const { filePath, name } = h
    if (/\.(m)?(j|t)s$/.test(filePath)) {

      points.push(filePath)

      includingTs = /\.ts(x)?$/.test(filePath) || includingTs
    }
  })

  if (includingTs && !ts) {
    throw new Error('[tarat] you are using ts file. please specific ts:true in tarat.config.js')
  }

  const buildOptions: esbuild.BuildOptions = {
    entryPoints: points,
    /**
     * because of removing unused module in the intact file and three-shaking
     */
    // bundle: false,
    bundle: true,
    external: [
      ...Object.keys(pacakgeJSON.dependencies || {}),
      ...Object.keys(pacakgeJSON.devDependencies || {}),
      ...Object.keys(pacakgeJSON.peerDependencies || {}),
      'drivers/*',
    ],
    allowOverwrite: true,
    outdir: outputDir,
    platform: 'node',
    format,
    treeShaking: true,
    plugins: [
      aliasAtCodeToCwd(cwd)
    ],
  }
  if (env === 'client') {
    buildOptions.plugins.push(
      clearFunctionBodyEsbuildPlugin(outputDir, hookFactoryFeatures.serverOnly)
    )
  }

  // check tsconfig
  if (includingTs) {
    buildOptions.tsconfig = getTSConfigPath(cwd)
  }

  await esbuild.build(buildOptions)

  if (fs.existsSync(outputDir)) {
    traverseDir(outputDir, (obj) => {
      // not ts file
      if (!obj.isDir) {
        if (/\.ts$/.test(obj.path)) {
          fs.rmSync(obj.path)
        } else {
          removeUnusedImports(obj.path)
          if (env) {
            replaceImportDriverPath(obj.path, format, env)
          }  
        }
      }
    })
  }
}

function buildDTS (c: IConfig, filePath: string, outputFile: string) {
  const tsconfigPath = getTSConfigPath(c.cwd)
  const json = loadJSON(tsconfigPath)

  const options: IBuildOption = {
    input: {
      input: filePath,
      plugins: [
        dts()
      ]
    },
    output: {
      file: outputFile,
      format: 'esm'
    }
  }

  return build(c, options)
}

export async function driversType(c: IConfig, outputDir: string) {
  const { drivers, driversDirectory } = c
  const cwdDirversDir = path.join(c.cwd, driversDirectory)
  const generateFiles: {
    name: string,
    destFile:string,
    destDir: string
    relativePath: string
  }[] = []

  await Promise.all(drivers.filter(({ filePath }) => /\.ts$/.test(filePath)).map(async h => {
    const { filePath, name , dir } = h
    const relativePath = path.relative(cwdDirversDir, dir)
    const destDir = path.join(outputDir, relativePath)
    const destFile = path.join(destDir, `${name}.d.ts`)
    generateFiles.push({
      name,
      destDir,
      relativePath,
      destFile,
    })
    await buildDTS(c, filePath, destFile)
  }))

  return generateFiles
}

/**
 * for server side running
 */
export async function buildDrivers (c: IConfig) {
  const {
    outputClientDriversDir,
    outputServerDriversDir,
    outputDriversDir,
  } = c.pointFiles
  const {
    esmDirectory,
    cjsDirectory,
    composeDriversDirectory
  } = c

  // 1.must build source dir first prevent to traverse below children dir 
  await esbuildDrivers(c, outputDriversDir, 'esm')

  // // build compose first
  const configWithComposeOnly: IConfig = { ...c, drivers: c.drivers.filter(p => /compose\//.test(p.filePath))}
  await Promise.all([
    // cjs for server
    esbuildDrivers(configWithComposeOnly, path.join(outputServerDriversDir, composeDriversDirectory), 'cjs', 'server'),
    // esm for client
    esbuildDrivers(configWithComposeOnly, path.join(outputClientDriversDir, composeDriversDirectory), 'esm', 'client'),
  ])

  // 2.run after source building
  const configWithoutCompose: IConfig = { ...c, drivers: c.drivers.filter(p => !/compose\//.test(p.filePath))}
  await Promise.all([
    // cjs
    esbuildDrivers(configWithoutCompose, path.join(outputServerDriversDir), 'cjs', 'server'),
    // // esm
    esbuildDrivers(configWithoutCompose, path.join(outputClientDriversDir), 'esm', 'client'),
  ])

  if (c.ts) {
    try {
      const files = await driversType(c, outputDriversDir)
      files.forEach(({ name, destFile, relativePath }) => {
        [outputClientDriversDir, outputServerDriversDir].forEach(outputEnvDir => {
          const dir = path.join(outputEnvDir, relativePath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir)
          }
          cp(destFile, dir)
        })
      })
    } catch (e) {
      console.error(e)
      logFrame(chalk.red('build hook dts fail'))
    }
  }
}

interface IModelIndexesBase {
  [k: string]: string | IModelIndexesBase
}


function findDependentIndexes (c: IConfig) {
  const schemaFiles: Array<{
    moduleName: string
    indexes: IModelIndexesBase
  }> = []

  c.dependencyModules.forEach(moduleName => {
    const dir = path.join(c.cwd, 'node_modules', moduleName)

    const depSchemaPath = path.join(dir, c.buildDirectory, c.modelsDirectory, c.schemaIndexes)
    const r2 = fs.existsSync(depSchemaPath)

    if (r2) {
      schemaFiles.push({
        moduleName,
        indexes: JSON.parse(fs.readFileSync(depSchemaPath).toString())
      })
    }
  })

  return schemaFiles
}

function deepInsertName (moduleName: string, indexes: IModelIndexesBase) {
  const dependentIndexesWithNamespace: IModelIndexesBase = {}
  traverse(indexes, (keys, val: string | IModelIndexesBase) => {
    if (typeof val === 'string') {
      set(dependentIndexesWithNamespace, keys, transformModelName(`${moduleName}_${upperFirst(val)}`))
    } else {
      set(dependentIndexesWithNamespace, keys, deepInsertName(moduleName, val))
    }
  })
  return dependentIndexesWithNamespace
}

export async function buildModelIndexes(c: IConfig) {
  if (c.model.engine === 'prisma') {

    const dependentIndexes = findDependentIndexes(c)

    let existPrismaPart = readExsitPrismaPart(c)
    if (existPrismaPart.length <= 0) {
      existPrismaPart = [].concat(readCurrentPrisma(c))
    }

    const schemaIndexesFile = path.join(c.cwd, c.modelsDirectory, c.schemaIndexes)

    const objArr = await Promise.all(existPrismaPart.map(async ({ content }) => {
      const model = await prismaInternals.getDMMF({
        datamodel: content
      })
      const models = model.datamodel.models
      const r: Record<string, string | Record<string, string>> = {}
      models.forEach(m => {
        r[lowerFirst(m.name)] = lowerFirst(m.name)
      })
      return r
    }))
    const mergedObj: IModelIndexesBase = objArr.reduce((p, n) => Object.assign(p, n), {})

    dependentIndexes.forEach(obj => {
      const dependentIndexesWithNamespace = deepInsertName(obj.moduleName, obj.indexes)

      mergedObj[obj.moduleName] = dependentIndexesWithNamespace
    })

    /**
     * eg
     * mergedObj = {
     *   modelA: string
     *   anyModule: {
     *     modelA: `anyModule`_modelA
     *   }
     * }
     */
    fs.writeFileSync(schemaIndexesFile, JSON.stringify(mergedObj, null, 2))
  }
}