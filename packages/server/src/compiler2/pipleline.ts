import * as esbuild from 'esbuild';
import { IConfig } from "../config";
import { AcornNode, InputOptions, ModuleFormat, OutputOptions, Plugin, rollup, RollupBuild } from 'rollup' 
import { join } from 'path';
import { aliasAtCodeToCwd, clearFunctionBodyEsbuildPlugin, removeUnusedImports, replaceImportDriverPath } from '../compiler/prebuild';
import { generateHookDeps } from '../compiler';
import { hookFactoryFeatures } from 'tarat/core';
import { traverseDir } from '../util';
import { existsSync, lstatSync, rmSync } from 'fs';


// read all files in directory
function readFiles (dir: string, ext: string = '') {
  // check file
  if (lstatSync(dir).isFile()) {
    return dir.endsWith(ext) ? [dir] : []
  }

  const files: string[] = []
  traverseDir(dir, (file) => {
    if (!file.dir) {
      if (ext) {
        if (file.file.endsWith(ext)) {
          files.push(file.path)
        }
      } else {
        files.push(file.path)
      }
    }
  })
  return files
}
// format input as files
function readInput (input: string | string[]) {
  const files = [].concat(input).map(inputItem => {
    if (lstatSync(inputItem).isDirectory()) {
      return readFiles(inputItem)
    } else {
      return inputItem
    }
  }).flat()

  return files
}


export interface IPipelineNodeVirtual {
  name: string
  type: 'virtual'
  build: (n: IPipelineNode) => Promise<void>,
}

export interface IPipelineNodeBase {
  name: string
  type: 'bundle' | 'compile' | 'generate'
  watchDirectory?: string | string[];
  input: IPipelineInput
  // output: string; // file or directory
  build: (n: IPipelineNode) => Promise<void>;
}

// for different input and outout
type IPipelineInput = {
  type: 'file' | 'directory'
  data: string[]
}

type IPipelineOutput = {
  type: 'directory',
  data: string
} | {
  type: 'file',
  data: string[]
}

interface IEsbuildNode extends IPipelineNodeBase {
  pack: 'esbuild';
  output: IPipelineOutput;
  options: esbuild.BuildOptions;
}
interface IRollupNode extends IPipelineNodeBase {
  pack: 'rollup'
  output: IPipelineOutput
  options: {
    input: InputOptions
    output: OutputOptions  
  }
}
interface IJSNode extends IPipelineNodeBase {
  pack: 'js'
  output?: IPipelineOutput
}

export type IPipelineNode = IPipelineNodeVirtual | IEsbuildNode | IRollupNode | IJSNode

class PipelineNode {
  parent: PipelineNode = null
  runningPromise: Promise<void> = null
  constructor(
    public node: IPipelineNode,
    public dependencies: PipelineNode[] = []
  ) {
    dependencies.forEach(n => n.setParent(this));
  }
  addDependencies (n: PipelineNode[]) {
    n.forEach(n => n.setParent(this))
  }
  setParent (n: PipelineNode) {
    this.parent = n
  }
  async start () {
    if (this.runningPromise) {
      return this.runningPromise
    }

    let resolve: () => void = null
    this.runningPromise = new Promise(async (r, reject) => {
      resolve = r
    })

    await Promise.all(this.dependencies.map(async child => {
      await child.start()
    }))
    await this.node.build(this.node)

    resolve()
    this.runningPromise = null

    console.log('node: ', this.node.name, 'build done');
  }
  watch () {

  }
  // recursive find child 
  find (name: string) {
    if (name === this.node.name) {
      return this
    }
    const { dependencies } = this
    let result = dependencies.find(n => n.node.name === name)
    if (!result) {
      for (let i = 0; i < dependencies.length; i++) {
        result = dependencies[i].find(name)
        if (result) {
          break
        }
      }
    }
    return result
  }
}

function driverEsbuildOptionWithBundle (config: IConfig): esbuild.BuildOptions {
  const { pacakgeJSON, cwd, driversDirectory, pointFiles } = config
  const { outputDriversDir } = pointFiles

  return {
    bundle: true,
    external: [
      ...Object.keys(pacakgeJSON?.dependencies || {}),
      ...Object.keys(pacakgeJSON?.devDependencies || {}),
      ...Object.keys(pacakgeJSON?.peerDependencies || {}),
      'drivers/*',
    ],
    allowOverwrite: true,
    platform: 'node',
    format: 'esm',
    treeShaking: true,
    plugins: [
      aliasAtCodeToCwd(cwd)
    ],  
  }
}

function driverEsbuildOptionBundleLess (config: IConfig): esbuild.BuildOptions {
  const { pacakgeJSON, cwd, driversDirectory, pointFiles } = config
  const { outputDriversDir } = pointFiles

  return {
    bundle: false,
    // external: [
    //   ...Object.keys(pacakgeJSON?.dependencies || {}),
    //   ...Object.keys(pacakgeJSON?.devDependencies || {}),
    //   ...Object.keys(pacakgeJSON?.peerDependencies || {}),
    //   'drivers/*',
    //   'tarat',
    // ],
    allowOverwrite: true,
    platform: 'node',
    format: 'esm',
    treeShaking: true,
    plugins: [
      aliasAtCodeToCwd(cwd)
    ],  
  }
}

export function commonDriverNode (config: IConfig, dependencies: PipelineNode[]) {
  const { pacakgeJSON, cwd, driversDirectory, pointFiles } = config
  const { outputDriversDir } = pointFiles

  const allDriverFiles = config.drivers.map(h => h.filePath)

  const node = new PipelineNode({
    name: 'commonDriverNode',
    type: 'compile',
    pack: 'esbuild',
    input: {
      type: 'file',
      data: allDriverFiles,
    },
    watchDirectory: join(cwd, driversDirectory),
    output: {
      type: 'directory',
      data: outputDriversDir,
    },
    options: driverEsbuildOptionBundleLess(config),
    async build(n: IEsbuildNode) {
      if (n.output.type === 'directory') {
        await esbuild.build({
          ...n.options,
          entryPoints: [].concat(n.input.data),
          outdir: n.output.data,
        })
      } else {
        throw new Error('output error')
      }
    },
  }, dependencies)

  return node
}

export function formatDriverNode (
  config: IConfig, dependencies: PipelineNode[],
  env: 'server' | 'client'
) {
  const { composeDriversDirectory, driversDirectory, pointFiles } = config
  const { outputServerDriversDir, outputClientDriversDir, outputDriversDir } = pointFiles
  const format = env === 'server' ? 'cjs' : 'esm'

  // read js files from inputs
  const compiledDrivers =  readFiles(outputDriversDir, '.js')
  
  const buildOptions: esbuild.BuildOptions = {
    ...driverEsbuildOptionWithBundle(config),
    format,
  }

  const outputDir = env === 'server' ? outputServerDriversDir: outputClientDriversDir

  if (env === 'client') {
    buildOptions.plugins.push(
      clearFunctionBodyEsbuildPlugin(outputDir, hookFactoryFeatures.serverOnly)
    )
  }
  const node = new PipelineNode({
    name: `formatDriverNode-${env}`,
    pack: 'esbuild',
    type: 'bundle',
    options: buildOptions,
    input: {
      type: 'file',
      data: compiledDrivers
    },
    output: {
      type: 'directory',
      data: outputDir
    },
    async build(n: IEsbuildNode) {
      if (n.output.type === 'directory') {
        await esbuild.build({
          ...n.options,
          entryPoints: [].concat(n.input.data),
          outdir: n.output.data,
        })

        if (existsSync(outputDir)) {
          traverseDir(outputDir, (obj) => {
            // not ts file
            if (!obj.isDir) {
              if (/\.ts$/.test(obj.path)) {
                rmSync(obj.path)
              } else {
                removeUnusedImports(obj.path)
                if (env) {
                  replaceImportDriverPath(obj.path, format, env)
                }  
              }
            }
          })
        }      
      } else {
        throw new Error('output error2')
      }
    }
  }, dependencies)

  return node
}

// inject deps to common driver after it build 
export function generateDepsNode (config: IConfig, dependencies: PipelineNode[]) {
  const { pacakgeJSON, cwd, driversDirectory, pointFiles } = config
  const { outputDriversDir } = pointFiles

  const inputDir = dependencies
    .map(dep => dep.node.type !== 'virtual' && dep.node.output.data)
    .filter(Boolean)

  const filesWithoutCompose = inputDir.map(dir => {
    return readInput(dir).filter(f => !/compose\//.test(f))
  }).flat()
  
  const node = new PipelineNode({
    name: 'generateDepsNode',
    type: 'generate',
    pack: 'js',
    input: {
      type: 'file',
      data: filesWithoutCompose
    },
    output: {
      type: 'file',
      data: filesWithoutCompose
    },
    async build(n: IJSNode) {
      /** @TODO should treat inputDir as the source for generate */
      generateHookDeps(config)
    },
  }, dependencies)

  return node
}

// as entry for whole pipline
function createTopPipelieNode (dependencies: PipelineNode[]) {

  const node = new PipelineNode({
    name: 'top',
    type: 'virtual',
    async build () {
    }
  }, dependencies)

  return node
}

// create for drivers
export function createDriverPipelineNode (config: IConfig) {
  const myCommonDriverNode = commonDriverNode(config, [])
  const myGenerateDepsNode = generateDepsNode(config, [myCommonDriverNode])

  const myServerDriverNode = formatDriverNode(config, [myGenerateDepsNode], 'server')  
  const myClientDriverNode = formatDriverNode(config, [myGenerateDepsNode], 'client')
  // const myClientComposeDriverNode = formatDriverNode(config, [myGenerateDepsNode], 'client', true)

  const driverTop = createTopPipelieNode([
    // myServerComposeDriverNode,
    // myClientComposeDriverNode,
    myServerDriverNode,
    myClientDriverNode,
  ])

  return driverTop
}

// create client bundle pack chain
export function createClientBundlePack (config: IConfig) {
  const { pacakgeJSON, cwd, driversDirectory, pointFiles } = config

  const driversNode = createDriverPipelineNode(config)

  const top = createTopPipelieNode([driversNode])

  return top
}