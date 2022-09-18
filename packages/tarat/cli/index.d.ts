import Application from 'koa';
import { THookDeps } from 'tarat/core';
import { InputOptions, OutputOptions, Plugin } from 'rollup';
import * as esbuild from 'esbuild';

interface IViewConfig$1 {
    /**
     * The unique id for this route, named like its `file` but without the
     * extension. So `app/routes/gists/$username.jsx` will have an `id` of
     * `routes/gists/$username`.
     */
    id: string;
    parentId: string;
    /**
     * The path this route uses to match on the URL pathname.
     */
    path: string;
    /**
     * single file name without file extension
     */
    name: string;
    index?: boolean;
    file: string;
    dir: boolean;
    dynamic: boolean;
}

declare const defaultConfig: () => {
    viewsDirectory: string;
    driversDirectory: string;
    composeDriversDirectory: string;
    modelsDirectory: string;
    appDirectory: string;
    pageDirectory: string;
    publicDirectory: string;
    entry: string;
    entryServer: string;
    routesServer: string;
    routes: string;
    ts: boolean;
    devCacheDirectory: string;
    buildDirectory: string;
    clientDir: string;
    serverDir: string;
    appClientChunk: string;
    cjsDirectory: string;
    esmDirectory: string;
    modelEnhance: string;
    prismaModelPart: string;
    targetSchemaPrisma: string;
    schemaIndexes: string;
    apiPre: string;
    diffPath: string;
    port: number;
    model: {
        engine: string;
    };
    compose: any[];
};
declare type IDefaultConfig = ReturnType<typeof defaultConfig> & {
    cjsDirectory: 'cjs';
    esmDirectory: 'esm';
    model?: {
        engine: 'prisma' | 'er';
    };
};
interface IViewConfig {
    /**
     * The unique id for this route, named like its `file` but without the
     * extension. So `app/routes/gists/$username.jsx` will have an `id` of
     * `routes/gists/$username`.
     */
    id: string;
    parentId: string;
    /**
     * The path this route uses to match on the URL pathname.
     */
    path: string;
    /**
     * single file name without file extension
     */
    name: string;
    index?: boolean;
    file: string;
    dir: boolean;
    dynamic: boolean;
}
interface IServerHookConfig {
    filePath: string;
    file: string;
    name: string;
    dir: string;
}
declare function readDrivers(dir: string): IServerHookConfig[];
declare type UnPromisify<T> = T extends Promise<infer R> ? R : T;
declare type IReadConfigResult = UnPromisify<ReturnType<typeof readConfig>>;
interface IConfig extends IReadConfigResult {
    model: {
        engine: 'prisma' | 'er';
    };
}
declare function readConfig(arg: {
    cwd: string;
    isProd?: boolean;
}): Promise<{
    pacakgeJSON: any;
    isProd: boolean;
    entryCSS: string;
    pointFiles: {
        outputDir: string;
        outputClientDir: string;
        outputServerDir: string;
        outputModelsDir: string;
        outputModelSchema: string;
        modelEnhanceFile: string;
        modelTargetFile: string;
        outputViewsDir: string;
        outputDriversDir: string;
        /** server */
        outputAppServerDir: string;
        autoGenerateServerRoutes: string;
        distServerRoutes: string;
        distServerRoutesCSS: string;
        distEntryJS: string;
        distEntryCSS: string;
        outputServerDriversDir: string;
        /** client */
        outputAppClientDir: string;
        autoGenerateClientRoutes: string;
        clientRoutes: string;
        clientRoutesCSS: string;
        outputClientDriversDir: string;
    };
    devPointFiles: {
        outputDir: string;
        outputClientDir: string;
        outputServerDir: string;
        outputModelsDir: string;
        outputModelSchema: string;
        modelEnhanceFile: string;
        modelTargetFile: string;
        outputViewsDir: string;
        outputDriversDir: string;
        /** server */
        outputAppServerDir: string;
        autoGenerateServerRoutes: string;
        distServerRoutes: string;
        distServerRoutesCSS: string;
        distEntryJS: string;
        distEntryCSS: string;
        outputServerDriversDir: string;
        /** client */
        outputAppClientDir: string;
        autoGenerateClientRoutes: string;
        clientRoutes: string;
        clientRoutesCSS: string;
        outputClientDriversDir: string;
    };
    buildPointFiles: {
        outputDir: string;
        outputClientDir: string;
        outputServerDir: string;
        outputModelsDir: string;
        outputModelSchema: string;
        modelEnhanceFile: string;
        modelTargetFile: string;
        outputViewsDir: string;
        outputDriversDir: string;
        /** server */
        outputAppServerDir: string;
        autoGenerateServerRoutes: string;
        distServerRoutes: string;
        distServerRoutesCSS: string;
        distEntryJS: string;
        distEntryCSS: string;
        outputServerDriversDir: string;
        /** client */
        outputAppClientDir: string;
        autoGenerateClientRoutes: string;
        clientRoutes: string;
        clientRoutesCSS: string;
        outputClientDriversDir: string;
    };
    cwd: string;
    drivers: {
        relativeDir: string;
        filePath: string;
        file: string;
        name: string;
        dir: string;
    }[];
    views: IViewConfig$1[];
    pages: IViewConfig$1[];
    dependencyModules: string[];
    viewsDirectory: string;
    driversDirectory: string;
    composeDriversDirectory: string;
    modelsDirectory: string;
    appDirectory: string;
    pageDirectory: string;
    publicDirectory: string;
    entry: string;
    entryServer: string;
    routesServer: string;
    routes: string;
    ts: boolean;
    devCacheDirectory: string;
    buildDirectory: string;
    clientDir: string;
    serverDir: string;
    appClientChunk: string;
    cjsDirectory: "cjs";
    esmDirectory: "esm";
    modelEnhance: string;
    prismaModelPart: string;
    targetSchemaPrisma: string;
    schemaIndexes: string;
    apiPre: string;
    diffPath: string;
    port: number;
    model: {
        engine: string;
    } & {
        engine: "prisma" | "er";
    };
    compose: any[];
}>;

declare function setupBasicServer(c: IConfig): Application<Application.DefaultState, Application.DefaultContext>;
declare function createDevServer(c: IConfig): Promise<void>;
declare function createServer(c: IConfig): Promise<Application<Application.DefaultState, Application.DefaultContext>>;

declare function setRunning(): Promise<void>;

declare function setPrisma(config: IConfig): Promise<void>;

declare function setCookies(): void;

declare function setER(): number;

declare function loadJSON(f: string): any;
declare function emptyDirectory(dir: string): void;
declare function lowerFirst(s: string): string;
declare function tryMkdir(dir: string): void;
declare function getDefeaultRoute(pages: IViewConfig[]): string;
declare function logFrame(content: string, length?: number): void;
declare function getAddress(): string;
declare function equalFileContent(c1: string, c2: string): boolean;
declare function isFileEmpty(code: string): boolean;
interface IFile {
    isDir: boolean;
    path: string;
    file: string;
    dir: string;
}
declare function traverseDir(dir: string, callback: (f: IFile) => void): void;
declare function time(sec?: boolean): () => number;
declare function __aa(): void;
declare function traverse(target: Record<string, any>, callback: (arrPath: string[], value: any) => void, parentKeys?: string[]): void;
declare function last<T>(arr: T[]): T;

declare function parseDeps(hookCode: string): {
    [x: string]: {
        names: [number, string][];
        deps: THookDeps;
    };
};

declare function composeSchema(c: IConfig): Promise<void>;
declare function composeDriver(c: IConfig): Promise<void>;

declare function buildClientRoutes(c: IConfig): Promise<void>;
declare function buildViews(c: IConfig): Promise<void>;

interface IBuildOption {
    input: InputOptions;
    output: OutputOptions;
}
/**
 * searches for tsconfig.json file starting in the current directory, if not found
 * use the default tsconfig.json provide by tarat
 */
declare function getTSConfigPath(c: IConfig): string;
declare function build(c: IConfig, op: IBuildOption): Promise<void>;
declare function getPlugins(input: {
    css: string | boolean;
    mode: 'dev' | 'build';
    target?: 'browser' | 'node' | 'unit';
    alias?: {
        [k: string]: string;
    };
    runtime?: 'server' | 'client';
}, c: IConfig): Plugin[];
declare function buildServerRoutes(c: IConfig): Promise<void>;
declare function buildEntryServer(c: IConfig): Promise<{
    entry: string;
    css: string;
}>;
/**
 * make sure hook will import the same module type
 */
declare function replaceImportDriverPath(sourceFile: string, format: esbuild.Format, env: 'client' | 'server'): void;
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
declare function removeUnusedImports(sourceFile: string): void;
declare function driversType(c: IConfig, outputDir: string): Promise<{
    name: string;
    destFile: string;
    destDir: string;
    relativePath: string;
}[]>;
/**
 * for server side running
 */
declare function buildDrivers(c: IConfig): Promise<void>;
declare function buildModelIndexes(c: IConfig): Promise<void>;

declare function injectDeps(c: IConfig, targetFile: string): void;
/** @TODO 1.integrated to the vite.plugin 2.upgrade to typescript */
declare function generateHookDeps(c: IConfig): void;

declare function printAST(code: any, node: any, depth?: number): void;
declare const removedFunctionBodyPlaceholder = "() => { /*! can not invoked in current runtime */ }";
declare function removeFunctionBody(code: string, names: string[]): string;

export { IBuildOption, IConfig, IDefaultConfig, IServerHookConfig, IViewConfig, __aa, build, buildClientRoutes, buildDrivers, buildEntryServer, buildModelIndexes, buildServerRoutes, buildViews, composeDriver, composeSchema, createDevServer, createServer, defaultConfig, driversType, emptyDirectory, equalFileContent, generateHookDeps, getAddress, getDefeaultRoute, getPlugins, getTSConfigPath, injectDeps, isFileEmpty, last, loadJSON, logFrame, lowerFirst, parseDeps, printAST, readConfig, readDrivers, removeFunctionBody, removeUnusedImports, removedFunctionBodyPlaceholder, replaceImportDriverPath, setCookies, setER, setPrisma, setRunning, setupBasicServer, time, traverse, traverseDir, tryMkdir };
