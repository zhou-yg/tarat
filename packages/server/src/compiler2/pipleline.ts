import * as esbuild from 'esbuild';
import { IConfig } from "../config";
import { AcornNode, InputOptions, ModuleFormat, OutputOptions, Plugin, rollup, RollupBuild } from 'rollup' 
import { join } from 'path';
import { aliasAtCodeToCwd } from '../compiler/prebuild';
import { generateHookDeps } from '../compiler';

export interface IPipelineNodeVirtual {
  name: string
  type: 'virtual'
  build: (n: IPipelineNode) => Promise<void>,
}

export interface IPipelineNodeBase {
  name: string
  type: 'bundle' | 'compile' | 'generate'
  watchDirectory: string | string[];
  input: string | string[]; // file or directory
  output: string; // file or directory
  build: (n: IPipelineNode) => Promise<void>;
}

interface IEsbuildNode extends IPipelineNodeBase {
  pack: 'esbuild'
  options: esbuild.BuildOptions
}
interface IRollupNode extends IPipelineNodeBase {
  pack: 'rollup'
  options: {
    input: InputOptions
    output: OutputOptions  
  }
}
interface IJSNode extends IPipelineNodeBase {
  pack: 'js'
}

export type IPipelineNode = IPipelineNodeVirtual | IEsbuildNode | IRollupNode | IJSNode

class PipelineNode {
  parent: PipelineNode = null
  constructor(
    public node: IPipelineNode,
    public dependencies: PipelineNode[] = []
  ) {
    dependencies.forEach(n => n.setParent(this));
  }
  setParent (n: PipelineNode) {
    this.parent = n
  }
  async start () {
    await Promise.all(this.dependencies.map(async child => {
      await child.start()
    }))
    await this.node.build(this.node)
  }
  watch () {

  }
  // recursive find child 
  findChild (name: string) {
    const { dependencies } = this
    let result = dependencies.find(n => n.node.name === name)
    if (!result) {
      for (let i = 0; i < dependencies.length; i++) {
        result = dependencies[i].findChild(name)
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
    input: allDriverFiles,
    watchDirectory: join(cwd, driversDirectory),
    output: outputDriversDir,
    options: driverEsbuildOptionBundleLess(config),
    async build(n: IEsbuildNode) {
      await esbuild.build({
        ...n.options,
        entryPoints: [].concat(n.input),
        outdir: n.output,
      })
    },
  }, dependencies)

  return node
}

// inject deps to common driver after it build 
export function generateDepsNode (config: IConfig, dependencies: PipelineNode[]) {
  const { pacakgeJSON, cwd, driversDirectory, pointFiles } = config
  const { outputDriversDir } = pointFiles

  const inputDir = dependencies.map(dep => dep.node.type !== 'virtual' ? dep.node.output : null).filter(Boolean)

  const node = new PipelineNode({
    name: 'generateDepsNode',
    type: 'generate',
    pack: 'js',
    watchDirectory: inputDir,
    input: inputDir,
    output: '',
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

// create client bundle pack chain
export function createClientBundlePack (config: IConfig) {
  const { pacakgeJSON, cwd, driversDirectory, pointFiles } = config

  const compileCommonDriversNode = commonDriverNode(config, [])

  const generateDepsToCommonDriverNode = generateDepsNode(config, [compileCommonDriversNode])

  const top = createTopPipelieNode([generateDepsToCommonDriverNode])

  return top
}