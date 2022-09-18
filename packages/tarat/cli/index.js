(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('cac'), require('path'), require('exit-hook'), require('chokidar'), require('chalk'), require('fs'), require('lodash'), require('rimraf'), require('os'), require('tarat/core'), require('koa-body'), require('@koa/cors'), require('koa'), require('koa-static'), require('express-to-koa'), require('tarat/connect'), require('@prisma/internals'), require('ejs'), require('react-dom/server'), require('vite'), require('vite-tsconfig-paths'), require('get-port'), require('acorn'), require('acorn-walk'), require('shelljs'), require('camel-case'), require('rollup'), require('@rollup/plugin-node-resolve'), require('@rollup/plugin-babel'), require('@rollup/plugin-json'), require('@rollup/plugin-commonjs'), require('rollup-plugin-postcss'), require('rollup-plugin-typescript2'), require('prettier'), require('esbuild'), require('rollup-plugin-auto-external'), require('@rollup/plugin-replace'), require('@rollup/plugin-alias'), require('rollup-plugin-dts'), require('typescript')) :
    typeof define === 'function' && define.amd ? define(['cac', 'path', 'exit-hook', 'chokidar', 'chalk', 'fs', 'lodash', 'rimraf', 'os', 'tarat/core', 'koa-body', '@koa/cors', 'koa', 'koa-static', 'express-to-koa', 'tarat/connect', '@prisma/internals', 'ejs', 'react-dom/server', 'vite', 'vite-tsconfig-paths', 'get-port', 'acorn', 'acorn-walk', 'shelljs', 'camel-case', 'rollup', '@rollup/plugin-node-resolve', '@rollup/plugin-babel', '@rollup/plugin-json', '@rollup/plugin-commonjs', 'rollup-plugin-postcss', 'rollup-plugin-typescript2', 'prettier', 'esbuild', 'rollup-plugin-auto-external', '@rollup/plugin-replace', '@rollup/plugin-alias', 'rollup-plugin-dts', 'typescript'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.cacFactory, global.path, global.exitHook, global.chokidar, global.chalk, global.fs, global.l, global.rimraf, global.os, global.core, global.koaBody, global.cors, global.Koa, global.staticServe, global.e2k, global.connect, global.prismaInternals, global.ejs, global.server, global.vite, global.tsconfigPaths, global.getPort, global.acorn, global.walk, global.shelljs, global.camelCase, global.rollup, global.resolve, global.pluginBabel, global.json, global.commonjs, global.postcss, global.tsPlugin, global.prettier, global.esbuild, global.autoExternal, global.replace, global.rollupAlias, global.dts, global.typescript));
})(this, (function (cacFactory, path, exitHook, chokidar, chalk, fs, l, rimraf, os, core, koaBody, cors, Koa, staticServe, e2k, connect, prismaInternals, ejs, server, vite, tsconfigPaths, getPort, acorn, walk, shelljs, camelCase, rollup, resolve, pluginBabel, json, commonjs, postcss, tsPlugin, prettier, esbuild, autoExternal, replace, rollupAlias, dts, typescript) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n["default"] = e;
        return Object.freeze(n);
    }

    var cacFactory__default = /*#__PURE__*/_interopDefaultLegacy(cacFactory);
    var path__namespace = /*#__PURE__*/_interopNamespace(path);
    var exitHook__default = /*#__PURE__*/_interopDefaultLegacy(exitHook);
    var chokidar__default = /*#__PURE__*/_interopDefaultLegacy(chokidar);
    var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
    var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
    var l__default = /*#__PURE__*/_interopDefaultLegacy(l);
    var rimraf__default = /*#__PURE__*/_interopDefaultLegacy(rimraf);
    var os__default = /*#__PURE__*/_interopDefaultLegacy(os);
    var koaBody__default = /*#__PURE__*/_interopDefaultLegacy(koaBody);
    var cors__default = /*#__PURE__*/_interopDefaultLegacy(cors);
    var Koa__default = /*#__PURE__*/_interopDefaultLegacy(Koa);
    var staticServe__default = /*#__PURE__*/_interopDefaultLegacy(staticServe);
    var e2k__default = /*#__PURE__*/_interopDefaultLegacy(e2k);
    var prismaInternals__namespace = /*#__PURE__*/_interopNamespace(prismaInternals);
    var tsconfigPaths__default = /*#__PURE__*/_interopDefaultLegacy(tsconfigPaths);
    var getPort__default = /*#__PURE__*/_interopDefaultLegacy(getPort);
    var walk__namespace = /*#__PURE__*/_interopNamespace(walk);
    var resolve__default = /*#__PURE__*/_interopDefaultLegacy(resolve);
    var json__default = /*#__PURE__*/_interopDefaultLegacy(json);
    var commonjs__default = /*#__PURE__*/_interopDefaultLegacy(commonjs);
    var postcss__default = /*#__PURE__*/_interopDefaultLegacy(postcss);
    var tsPlugin__default = /*#__PURE__*/_interopDefaultLegacy(tsPlugin);
    var prettier__namespace = /*#__PURE__*/_interopNamespace(prettier);
    var esbuild__namespace = /*#__PURE__*/_interopNamespace(esbuild);
    var autoExternal__default = /*#__PURE__*/_interopDefaultLegacy(autoExternal);
    var replace__default = /*#__PURE__*/_interopDefaultLegacy(replace);
    var rollupAlias__default = /*#__PURE__*/_interopDefaultLegacy(rollupAlias);
    var dts__default = /*#__PURE__*/_interopDefaultLegacy(dts);

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    var name = "tarat-server";
    var version = "0.0.8";
    var description = "tarat ssr framework server side";
    var main = "./dist/index.js";
    var types = "./dist/index.d.ts";
    var bin = {
    	tarat: "./dist/cli/index.js"
    };
    var files = [
    	"src",
    	"cli",
    	"adaptors",
    	"pacakge.json",
    	"dist"
    ];
    var scripts = {
    	wu: "sh scripts/compiler-unit.sh",
    	"test-unit": "jest",
    	"test-ci": "TEST=CI jest",
    	"build:examples": "node scripts/build-all-examples.mjs",
    	build: "rm -rf dist/ && node scripts/build.mjs",
    	"build:dev": "rollup --config rollup.config.mjs",
    	"build:watch": "npm run build && rollup --config rollup.config.mjs --watch"
    };
    var license = "ISC";
    var repository = {
    	type: "git",
    	url: "git+https://github.com/zhou-yg/tarat.git"
    };
    var author = "zhouyg";
    var bugs = {
    	url: "https://github.com/zhou-yg/tarat/issues"
    };
    var homepage = "https://github.com/zhou-yg/tarat#readme";
    var devDependencies = {
    	"@jsdevtools/version-bump-prompt": "6.1.0",
    	"@rollup/plugin-replace": "^4.0.0",
    	"@types/ejs": "^3.1.1",
    	"@types/express-to-koa": "^1.0.0",
    	"@types/koa-bodyparser": "^4.3.7",
    	"@types/koa-static": "^4.0.2",
    	"@types/koa__cors": "^3.3.0",
    	"@types/lodash": "^4.14.182",
    	"@types/react": "^18.0.15",
    	"@types/react-dom": "^18.0.6",
    	"@types/rimraf": "^3.0.2",
    	"@types/rollup-plugin-auto-external": "^2.0.2",
    	"@types/shelljs": "^0.8.11",
    	rollup: "^2.74.1",
    	"rollup-plugin-dts": "^4.2.2",
    	"rollup-plugin-typescript2": "^0.31.2",
    	tslib: "^2.4.0"
    };
    var dependencies = {
    	"@babel/parser": "^7.18.8",
    	"@babel/preset-react": "^7.18.6",
    	"@koa/cors": "^3.3.0",
    	"@prisma/internals": "^4.0.0",
    	"@prisma/sdk": "^4.0.0",
    	"@rollup/plugin-alias": "^3.1.9",
    	"@rollup/plugin-babel": "^5.3.1",
    	"@rollup/plugin-commonjs": "^22.0.1",
    	"@rollup/plugin-json": "^4.1.0",
    	"@rollup/plugin-node-resolve": "^13.3.0",
    	"@types/estree": "^0.0.52",
    	"@types/koa": "^2.13.5",
    	"@types/node": "^18.6.2",
    	"@types/rollup-plugin-less": "^1.1.0",
    	acorn: "^8.7.1",
    	"acorn-walk": "^8.2.0",
    	cac: "^6.7.12",
    	"camel-case": "^4.1.2",
    	chalk: "4.x.x",
    	chokidar: "^3.5.3",
    	ejs: "^3.1.8",
    	esbuild: "^0.14.43",
    	"esbuild-plugin-alias": "^0.2.1",
    	execa: "6.x.x",
    	"exit-hook": "2.x.x",
    	"express-to-koa": "^2.0.0",
    	"get-port": "5.1.1",
    	"jsx-transform": "^2.4.1",
    	koa: "^2.13.4",
    	"koa-body": "^5.0.0",
    	"koa-static": "^5.0.0",
    	lodash: "^4.17.21",
    	"lodash-es": "^4.17.21",
    	"magic-string": "^0.26.2",
    	postcss: "^8.4.14",
    	prettier: "^2.6.2",
    	react: "^18.2.0",
    	"react-dom": "^18.2.0",
    	rimraf: "^3.0.2",
    	"rollup-plugin-analyzer": "^4.0.0",
    	"rollup-plugin-auto-external": "^2.0.0",
    	"rollup-plugin-jsx": "^1.0.3",
    	"rollup-plugin-less": "^1.1.3",
    	"rollup-plugin-postcss": "^4.0.2",
    	"rollup-pluginutils": "^2.8.2",
    	shelljs: "^0.8.5",
    	tarat: "workspace:*",
    	vite: "^2.9.12",
    	"vite-tsconfig-paths": "^3.5.0"
    };
    var pkg = {
    	name: name,
    	version: version,
    	description: description,
    	main: main,
    	types: types,
    	bin: bin,
    	files: files,
    	scripts: scripts,
    	license: license,
    	repository: repository,
    	author: author,
    	bugs: bugs,
    	homepage: homepage,
    	devDependencies: devDependencies,
    	dependencies: dependencies
    };

    const isIndexFlagn = (f) => /^index.(j|t)sx$/.test(f) || /\/index.(j|t)sx$/.test(f);
    const isPageFile = (f) => /\.(j|t)sx$/.test(f);
    function defineView(viewDir, file, name, parent) {
        const configs = [];
        const currentFileOrDirPath = path__namespace.join(viewDir, file);
        const current = {
            id: file,
            parentId: (parent === null || parent === void 0 ? void 0 : parent.id) || '',
            path: file.replace(/\.\w+/, ''),
            file,
            name: name.replace(/\.\w+/, ''),
            index: isIndexFlagn(file),
            dir: fs__namespace.lstatSync(currentFileOrDirPath).isDirectory(),
            dynamic: /^\:/.test(name)
        };
        if (current.dir) {
            const childConfigs = readViews(viewDir, file, current);
            configs.push(...childConfigs);
        }
        configs.push(current);
        return configs;
    }
    function readViews(viewDir, dir, parent) {
        const d = path__namespace.join(viewDir, dir);
        if (!fs__namespace.existsSync(d)) {
            return [];
        }
        const views = fs__namespace.readdirSync(d);
        const viewConfigs = views.filter(f => {
            const file = path__namespace.join(viewDir, dir, f);
            return isPageFile(file) || fs__namespace.lstatSync(file).isDirectory();
        }).map(f => {
            const file = path__namespace.join(dir, f);
            return defineView(viewDir, file, f, parent);
        });
        return viewConfigs.flat();
    }
    function defineRoutesTree(pages) {
        const routesMap = {};
        pages.forEach(p => {
            routesMap[p.id] = Object.assign({
                children: []
            }, p);
        });
        pages.forEach(p => {
            if (p.parentId) {
                const child = routesMap[p.id];
                routesMap[p.parentId].children.push(child);
            }
        });
        return Object.values(routesMap).filter(p => !p.parentId);
    }
    function matchRoute(pages, pathname) {
        let directlyMatchedPage = pages.find(v => v.path === pathname || v.path === path__namespace.join(pathname, 'index'));
        if (!directlyMatchedPage) {
            // pathname maybe is dynmaic route
            const arr = pathname.split('/');
            directlyMatchedPage = pages.find(v => {
                const routePathArr = v.path.split('/');
                return (arr.length === routePathArr.length &&
                    arr.slice(0, -1).join('/') === routePathArr.slice(0, -1).join('/') &&
                    v.dynamic);
            });
        }
        return directlyMatchedPage;
    }

    function loadJSON(f) {
        return JSON.parse(fs__namespace.readFileSync(f).toString());
    }
    function emptyDirectory(dir) {
        if (fs__namespace.existsSync(dir)) {
            rimraf__default["default"].sync(dir);
        }
        fs__namespace.mkdirSync(dir);
    }
    function lowerFirst$1(s) {
        return s[0].toLowerCase() + s.substring(1);
    }
    function tryMkdir(dir) {
        !fs__namespace.existsSync(dir) && fs__namespace.mkdirSync(dir);
    }
    function logFrame(content, length = 100) {
        const lineArr = new Array(length).fill('-');
        const line2 = lineArr.join('');
        const title = ' tarat ';
        lineArr.splice(1, 0, title);
        const line1 = lineArr.slice(0, -title.length).join('');
        const rows = content.split('\n').map(c => {
            return c.trim().match(new RegExp(`.{1,${length - 4}}`, 'g'));
        }).filter(Boolean).flat();
        return console.log([
            line1,
            ...((rows === null || rows === void 0 ? void 0 : rows.map(s => `| ${s}`)) || []),
            line2
        ].join('\n'));
    }
    function getAddress() {
        var _a;
        const address = process.env.HOST ||
            ((_a = Object.values(os__default["default"].networkInterfaces())
                .flat()
                .find((ip) => (ip === null || ip === void 0 ? void 0 : ip.family) === "IPv4" && !ip.internal)) === null || _a === void 0 ? void 0 : _a.address);
        return address;
    }
    function equalFileContent(c1, c2) {
        return core.isEqual(c1.split('\n').map(r => r.trim()).filter(Boolean), c2.split('\n').map(r => r.trim()).filter(Boolean));
    }
    function isFileEmpty(code) {
        return code.replace(/\n/g, '').trim().length === 0;
    }
    function traverseDir(dir, callback) {
        const files = fs__namespace.readdirSync(dir);
        files.forEach(f => {
            const p = path__namespace.join(dir, f);
            const isDir = fs__namespace.lstatSync(p).isDirectory();
            callback({
                isDir,
                dir,
                file: f,
                path: p
            });
            if (isDir) {
                traverseDir(p, callback);
            }
        });
    }
    function time(sec = true) {
        let st = Date.now();
        return () => {
            const v = Date.now() - st;
            return sec ? Math.floor(v / 1000) : v;
        };
    }
    function traverse(target, callback, parentKeys) {
        if (!parentKeys) {
            parentKeys = [];
        }
        Object.entries(target).forEach(([key, value]) => {
            const currentKeys = parentKeys.concat(key);
            value && callback(currentKeys, value);
            if (typeof value === 'object' && value) {
                traverse(value, callback, currentKeys);
            }
        });
    }
    function last(arr) {
        return arr[arr.length - 1];
    }

    function findDependencies(cwd) {
        const pkgJSON = loadJSON(path__namespace.join(cwd, 'package.json'));
        const pkgModules = Object.keys(pkgJSON.dependencies || {});
        const modules = pkgModules.filter(moduleName => {
            const dir = path__namespace.join(cwd, 'node_modules', moduleName);
            const pkg = path__namespace.join(dir, 'package.json');
            if (fs.existsSync(pkg)) {
                const r1 = !!loadJSON(pkg).tarat;
                return r1;
            }
            else {
                logFrame(chalk__default["default"].red(`dependency module "${moduleName}" hasnt installed`));
            }
        });
        return modules;
    }

    const { merge } = l__default["default"];
    const defaultConfig = () => ({
        // client about
        viewsDirectory: 'views',
        driversDirectory: 'drivers',
        composeDriversDirectory: 'compose',
        modelsDirectory: 'models',
        appDirectory: 'app',
        pageDirectory: 'pages',
        publicDirectory: 'public',
        entry: 'entry',
        entryServer: 'entry.server',
        routesServer: 'routes.server',
        routes: 'routes',
        ts: false,
        devCacheDirectory: '.tarat',
        buildDirectory: 'dist',
        clientDir: 'client',
        serverDir: 'server',
        appClientChunk: 'chunks',
        cjsDirectory: 'cjs',
        esmDirectory: 'esm',
        modelEnhance: 'model.enhance.json',
        prismaModelPart: 'part.prisma',
        targetSchemaPrisma: 'schema.prisma',
        schemaIndexes: 'indexes',
        // server side
        apiPre: '_hook',
        diffPath: '_diff',
        port: 9100,
        model: {
            engine: 'prisma'
        },
        // compose
        compose: []
    });
    const configFile = 'tarat.config.js';
    function readPages(viewDir, dir) {
        const pages = readViews(viewDir, dir);
        return pages;
    }
    function readDrivers(dir) {
        if (!fs__namespace.existsSync(dir)) {
            return [];
        }
        const drivers = fs__namespace.readdirSync(dir);
        const hookConfigs = [];
        // check drivers
        drivers.forEach(f => {
            const p = path__namespace.join(dir, f);
            if (fs__namespace.lstatSync(p).isDirectory()) {
                const children = readDrivers(p);
                hookConfigs.push(...children);
            }
        });
        const hookConfigs2 = drivers.filter(f => {
            const filePath = path__namespace.join(dir, f);
            return fs__namespace.lstatSync(filePath).isFile();
        }).map(f => {
            const filePath = path__namespace.join(dir, f);
            const name = f.replace(/\.\w+/, '');
            const code = fs__namespace.readFileSync(filePath).toString();
            const empty = isFileEmpty(code);
            if (!empty) {
                const exportDefaultNames = code.match(/export default (function [A-Za-z0-9_]+;?|[A-Za-z0-9_]+);?/);
                const exportDefaultAuto = code.match(/export { default }/);
                if (exportDefaultNames) {
                    if (exportDefaultNames[1] !== name && exportDefaultNames[1] !== `function ${name}`) {
                        logFrame(`The default export name mismatch file name
            export default name is ${chalk__default["default"].red(exportDefaultNames[1])}
            file name is ${chalk__default["default"].green(name)}`);
                        throw new Error('[readDrivers] error 2');
                    }
                }
                else if (!exportDefaultAuto) {
                    logFrame(`Must have a default export in ${filePath}`);
                    throw new Error('[readDrivers] error 1');
                }
            }
            return {
                dir,
                filePath,
                file: f,
                name,
            };
        });
        hookConfigs.push(...hookConfigs2);
        return hookConfigs;
    }
    function getOutputFiles(config, cwd, outputDir) {
        const outputClientDir = path__namespace.join(outputDir, config.clientDir);
        const outputServerDir = path__namespace.join(outputDir, config.serverDir);
        const outputAppServerDir = path__namespace.join(outputServerDir, config.appDirectory);
        const outputAppClientDir = path__namespace.join(outputClientDir, config.appDirectory);
        return {
            outputDir,
            outputClientDir,
            outputServerDir,
            // prisma
            outputModelsDir: path__namespace.join(outputDir, config.modelsDirectory),
            outputModelSchema: path__namespace.join(outputDir, config.modelsDirectory, config.targetSchemaPrisma),
            modelEnhanceFile: path__namespace.join(cwd, config.modelsDirectory, config.modelEnhance),
            modelTargetFile: path__namespace.join(cwd, config.modelsDirectory, config.targetSchemaPrisma),
            // views
            outputViewsDir: path__namespace.join(outputDir, config.viewsDirectory),
            outputDriversDir: path__namespace.join(outputDir, config.driversDirectory),
            /** server */
            // app
            outputAppServerDir,
            // router
            autoGenerateServerRoutes: path__namespace.join(outputAppServerDir, `${config.routesServer}${config.ts ? '.tsx' : '.jsx'}`),
            distServerRoutes: path__namespace.join(outputAppServerDir, `${config.routesServer}.js`),
            distServerRoutesCSS: path__namespace.join(outputAppServerDir, `${config.routesServer}.css`),
            // entry
            distEntryJS: path__namespace.join(outputAppServerDir, `${config.entryServer}.js`),
            distEntryCSS: path__namespace.join(outputAppServerDir, `${config.entryServer}.css`),
            // drivers
            outputServerDriversDir: path__namespace.join(outputServerDir, config.driversDirectory),
            /** client */
            // app
            outputAppClientDir,
            // router
            autoGenerateClientRoutes: path__namespace.join(outputAppClientDir, `${config.routes}${config.ts ? '.tsx' : '.jsx'}`),
            clientRoutes: path__namespace.join(outputAppClientDir, 'index.js'),
            clientRoutesCSS: path__namespace.join(outputAppClientDir, 'index.css'),
            // drivers
            outputClientDriversDir: path__namespace.join(outputClientDir, config.driversDirectory),
        };
    }
    function readEntryCSS(pre) {
        const postfix = ['less', 'css'];
        let r = '';
        postfix.forEach(p => {
            const f = `${pre}.${p}`;
            if (fs__namespace.existsSync(f)) {
                if (r) {
                    throw new Error(`[config.readEntryCSS] should not have duplcate style file from ${postfix}`);
                }
                else {
                    r = f;
                }
            }
        });
        return r;
    }
    function readConfig(arg) {
        return __awaiter(this, void 0, void 0, function* () {
            const { cwd, isProd } = arg;
            const configFileInPath = path__namespace.join(cwd, configFile);
            let config = defaultConfig();
            if (fs__namespace.existsSync(configFileInPath)) {
                const configInFile = require(configFileInPath);
                merge(config, configInFile);
            }
            const pacakgeJSON = loadJSON(path__namespace.join(cwd, 'package.json'));
            const viewsDirectory = path__namespace.join(cwd, config.viewsDirectory);
            const driversDirectory = path__namespace.join(cwd, config.driversDirectory);
            const appDirectory = path__namespace.join(cwd, config.appDirectory);
            const pagesDirectory = path__namespace.join(appDirectory, config.pageDirectory);
            const views = readViews(viewsDirectory, '/');
            views.forEach(c => {
                c.file = path__namespace.join('./', config.viewsDirectory, c.file);
            });
            const pages = readPages(pagesDirectory, '/');
            pages.forEach(c => {
                c.file = path__namespace.join('./', config.appDirectory, config.pageDirectory, c.file);
            });
            const drivers = readDrivers(driversDirectory).map(d => {
                return Object.assign(Object.assign({}, d), { relativeDir: path__namespace.relative(driversDirectory, d.dir) });
            });
            const entryCSS = readEntryCSS(path__namespace.join(cwd, config.appDirectory, config.entry));
            const devPointFiles = getOutputFiles(config, cwd, path__namespace.join(cwd, config.devCacheDirectory));
            const buildPointFiles = getOutputFiles(config, cwd, path__namespace.join(cwd, config.buildDirectory));
            // default to "dev"
            const pointFiles = isProd ? buildPointFiles : devPointFiles;
            const dependencyModules = findDependencies(cwd);
            return Object.assign(Object.assign({}, config), { pacakgeJSON,
                isProd,
                entryCSS,
                pointFiles,
                devPointFiles,
                buildPointFiles,
                cwd,
                drivers,
                views,
                pages,
                dependencyModules });
        });
    }

    let currentRunningMap = new Map();
    function setRunning() {
        return __awaiter(this, void 0, void 0, function* () {
            core.loadPlugin('GlobalRunning', {
                setCurrent(scope, api) {
                    // console.trace('scope, api: ', !!scope, api);
                    currentRunningMap.set(scope, api);
                },
                getCurrent(scope) {
                    // console.log('currentRunningMap: ', currentRunningMap);
                    return currentRunningMap.get(scope) || null;
                }
            });
        });
    }

    function setPrisma(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const { cwd } = config;
            const schemaFile = path.join(cwd, config.modelsDirectory, config.targetSchemaPrisma);
            let client;
            if (fs.existsSync(schemaFile)) {
                const gen = yield prismaInternals__namespace.getGenerator({
                    schemaPath: schemaFile,
                    dataProxy: false
                });
                const output = gen.config.output.value;
                client = (require(output));
            }
            else {
                // make sure import the prisma from current development project
                // @ts-ignore
                client = (yield import(path.join(cwd, 'node_modules/@prisma/client/index.js')));
            }
            if (!client.PrismaClient) {
                throw new Error('[setPrisma] error, prisma.PrismaClient not found please run prisma generate first');
            }
            const prisma = new client.PrismaClient();
            console.log('prisma.$connect: ', prisma.$connect);
            const connectResult = prisma.$connect();
            connectResult.then(() => {
                console.log('connect success');
            });
            // connectResult.then(() => {
            //   console.log('connect success')
            //   const r = prisma.storageItem.create({
            //     "data": {
            //       "name": "kkk",
            //       "link": "/注册界面.png",
            //       "user": {
            //         "connect": {
            //           "id": "cl77pu30l0024fbuvcot5gu5e"
            //         }
            //       }
            //     }
            //   })
            // }).catch(e => {
            //   console.log('e: ', e);
            // })
            core.loadPlugin('Model', {
                find(from, e, w) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return prisma[e].findMany(w).then(r => r);
                    });
                },
                update(from, e, w) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return prisma[e].update(w).then(r => r);
                    });
                },
                remove(from, e, d) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return prisma[e].delete(d).then(r => r);
                    });
                },
                create(from, e, q) {
                    return __awaiter(this, void 0, void 0, function* () {
                        return prisma[e].create(q).then(r => r);
                    });
                },
                // should check relation here
                executeDiff(from, e, d) {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield Promise.all(d.create.map((obj) => __awaiter(this, void 0, void 0, function* () {
                            yield prisma[e].create({
                                data: obj.value
                            });
                        })));
                        yield Promise.all(d.update.map((obj) => __awaiter(this, void 0, void 0, function* () {
                            const { source } = obj;
                            if (source.id === undefined || source.id === null) {
                                throw new Error('[update] must with a id');
                            }
                            yield prisma[e].update({
                                where: {
                                    id: source.id
                                },
                                data: obj.value
                            });
                        })));
                        yield Promise.all(d.remove.map((obj) => __awaiter(this, void 0, void 0, function* () {
                            const { source, value } = obj;
                            if (value.id === undefined || value.id === null) {
                                throw new Error('[remove] must with a id');
                            }
                            yield prisma[e].delete({
                                where: {
                                    id: value.id
                                },
                            });
                        })));
                    });
                },
            });
        });
    }

    function setCookies() {
        core.loadPlugin('cookie', {
            set(s, k, value) {
                var _a;
                return __awaiter(this, void 0, void 0, function* () {
                    console.trace('[setCookies.set]: ', k, value);
                    console.log('[setCookies.set]: ', core.getPlugin('GlobalRunning').getCurrent(s), !!s);
                    if (typeof value === 'string') {
                        (_a = core.getPlugin('GlobalRunning').getCurrent(s)) === null || _a === void 0 ? void 0 : _a.cookies.set(k, value);
                    }
                });
            },
            get(s, k) {
                var _a;
                return __awaiter(this, void 0, void 0, function* () {
                    const v = (_a = core.getPlugin('GlobalRunning').getCurrent(s)) === null || _a === void 0 ? void 0 : _a.cookies.get(k);
                    // console.trace('[setCookies.get] s, k: ', k, v);
                    // console.log('[setCookies.get] s, k: ', getPlugin('GlobalRunning').getCurrent(s));
                    return v;
                });
            },
            clear(s, k) {
                var _a;
                (_a = core.getPlugin('GlobalRunning').getCurrent(s)) === null || _a === void 0 ? void 0 : _a.cookies.set(k, '');
            },
        });
    }

    function hasAnyFiles(req) {
        return req.files && Object.keys(req.files).length > 0;
    }
    class SimulateBrowserFile {
        constructor(f) {
            Object.assign(this, f);
            this.name = f.originalFilename;
        }
    }
    function unserializeObjToJSON(obj) {
        Object.entries(obj).forEach(([k, v]) => {
            if (!(v instanceof SimulateBrowserFile)) {
                obj[k] = connect.parseWithUndef(v);
            }
        });
        Object.entries(obj).forEach(([k, v]) => {
            if (v instanceof SimulateBrowserFile) {
                const kArr = k.split(connect.BINARY_FILE_KEY_SPLIT_CHAR);
                const placeholderValue = core.get(obj, kArr);
                if (placeholderValue === connect.BINARY_FILE_TYPE_PLACEHOLDER) {
                    core.set(obj, kArr, v);
                    delete obj[k];
                }
            }
        });
        return obj;
    }
    /**
     * prevent File from sending to client side
     */
    function filterFileType(c) {
        const data = c.data.map(v => {
            if (v[1] instanceof SimulateBrowserFile) {
                return ['unserialized'];
            }
            return v;
        });
        return Object.assign({}, c, {
            data
        });
    }
    function unserializeWithFile() {
        return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const valid = hasAnyFiles(ctx.request);
            if (valid) {
                const { body, files } = ctx.request;
                console.log('files: ', files);
                Object.entries(files).forEach(([k, v]) => {
                    body[k] = new SimulateBrowserFile(v);
                });
                const newBody = unserializeObjToJSON(Object.assign({}, body));
                ctx.request.body = newBody;
            }
            yield next();
        });
    }

    function matchHookName(p) {
        const arr = p.split('/').filter(Boolean);
        return {
            pre: arr[0],
            driverName: arr[1]
        };
    }
    function wrapCtx(ctx) {
        return {
            cookies: {
                set(name, value) {
                    console.log('[wrapCtx.cookies] name, value: ', name, value);
                    return ctx.cookies.set(name, value);
                },
                get(name) {
                    console.log('[wrapCtx.cookies] get name: ', name);
                    const val = ctx.cookies.get(name);
                    return val;
                }
            }
        };
    }
    /**
     * @TODO should provide by @tarat-run by default
     */
    function taratMiddleware(args) {
        const { config } = args;
        const { drivers, apiPre, diffPath, cwd, model, pointFiles } = config;
        setRunning();
        setCookies();
        if ((model === null || model === void 0 ? void 0 : model.engine) === 'prisma') {
            setPrisma(config);
        }
        else if ((model === null || model === void 0 ? void 0 : model.engine) === 'er') ;
        return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const { path: path$1, body } = ctx.request;
            const { pre, driverName } = matchHookName(path$1);
            if (pre === apiPre && ctx.request.method === 'POST') {
                const hookConfig = drivers.find(h => h.name === driverName);
                if (hookConfig) {
                    const driver = config.drivers.find(d => d.name === driverName);
                    // driver has double nested output structure
                    const BMPath = path.join(pointFiles.outputServerDriversDir, config.cjsDirectory, driver.relativeDir, `${driverName}.js`);
                    const BM = require(BMPath);
                    const c = typeof body === 'string' ? connect.parseWithUndef(body) : body;
                    let runner = new core.Runner(BM.default);
                    let scope = runner.prepareScope(c.initialArgList, c);
                    core.getPlugin('GlobalRunning').setCurrent(scope, wrapCtx(ctx));
                    console.log('==== before exeexecuteDriver ===============');
                    const chain1 = core.startdReactiveChain(`${driverName}(init)`);
                    runner.executeDriver(scope);
                    yield scope.ready();
                    chain1.stop();
                    chain1.print();
                    // debuggerLog(true)
                    const chain2 = core.startdReactiveChain(`${driverName}:call(${c.index})`);
                    if (c.index !== undefined) {
                        yield scope.callHook(c.index, c.args);
                    }
                    yield scope.ready();
                    core.getPlugin('GlobalRunning').setCurrent(scope, null);
                    chain2.stop();
                    chain2.print();
                    const context = scope.createPatchContext();
                    /* @TODO: stringifyWithUndef prevent sending server File to browser */
                    const contextWithoutFile = filterFileType(context);
                    ctx.body = connect.stringifyWithUndef(contextWithoutFile);
                    runner = null;
                    scope = null;
                    console.log(`[${driverName}] is end \n ---`);
                }
                else {
                    yield next();
                }
            }
            else if (pre === diffPath && ctx.request.method === 'POST') {
                const c = JSON.parse(ctx.request.body);
                yield core.getPlugin('Model').executeDiff('@unknownExecuteDiff', c.entity, c.diff);
                ctx.body = JSON.stringify({});
            }
            else {
                yield next();
            }
        });
    }

    const templateFile$1 = './pageTemplate.ejs';
    const templateFilePath$1 = path__namespace.join(__dirname, templateFile$1);
    const template$1 = ejs.compile(fs__namespace.readFileSync(templateFilePath$1).toString());
    function transformIndexHtml(html, c) {
        return html.replace(new RegExp(`${c.pointFiles.outputDir}`, 'g'), '');
    }
    function renderPage(ctx, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const { distServerRoutes, distEntryJS, distEntryCSS, distServerRoutesCSS } = config.pointFiles;
            let entryFunctionModule = (doc) => doc;
            if (fs__namespace.existsSync(distEntryJS)) {
                entryFunctionModule = require(distEntryJS);
            }
            const routesEntryModule = require(distServerRoutes);
            const driver = new connect.RenderDriver();
            driver.mode = 'collect';
            let cancelGlobalRunning = () => { };
            console.log('[before driver.onPush] : ');
            driver.onPush(scope => {
                core.getPlugin('GlobalRunning').setCurrent(scope, wrapCtx(ctx));
                cancelGlobalRunning = () => {
                    core.getPlugin('GlobalRunning').setCurrent(scope, null);
                };
            });
            const routerLocation = ctx.request.path + ctx.request.search;
            const chain = core.startdReactiveChain('[renderWithDriverContext first]');
            const appEntry = connect.renderWithDriverContext(entryFunctionModule(routesEntryModule({
                location: routerLocation
            })), driver);
            core.debuggerLog(true);
            console.log('[before renderToString] first ');
            const html = server.renderToString(appEntry.root);
            appEntry.cancelAdaptor();
            driver.pushListener = undefined;
            cancelGlobalRunning();
            let allRunedHook = [];
            for (const BMArr of driver.BMValuesMap.values()) {
                allRunedHook = allRunedHook.concat(BMArr);
            }
            yield Promise.all(allRunedHook.map((scope) => {
                return scope.ready();
            }));
            chain.stop();
            chain.print();
            console.log('---- await first done ----');
            const st = Date.now();
            driver.switchToServerConsumeMode();
            const chain2 = core.startdReactiveChain('[renderWithDriverContext second]');
            const appEntryUpdate = connect.renderWithDriverContext(entryFunctionModule(routesEntryModule({
                location: routerLocation
            })), driver);
            const html2 = server.renderToString(appEntryUpdate.root);
            chain2.stop();
            chain2.print();
            const cost = Date.now() - st;
            const css = [];
            fs__namespace.existsSync(distEntryCSS) && css.push(distEntryCSS);
            fs__namespace.existsSync(distServerRoutesCSS) && css.push(distServerRoutesCSS);
            console.log(`[${routerLocation}] is end. second rendering cost ${chalk__default["default"].blue(cost)} ms \n ---`);
            return {
                driver,
                html,
                html2,
                // css: css + entryServerCss,
                css,
            };
        });
    }
    /**
     * @TODO should provide by default
     */
    function page(args) {
        const config = args.config;
        return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const pathname = ctx.request.path;
            const viewConfig = matchRoute(args.pages, pathname);
            if (viewConfig) {
                let context = {};
                let ssrHTML = '';
                console.log('>> start render page path=', pathname);
                const r = yield renderPage(ctx, args.config);
                if (r) {
                    for (const v of r.driver.BMValuesMap) {
                        context[v[0]] = v[1].map((scope) => scope.createBaseContext());
                    }
                    ssrHTML = r.html2;
                }
                const { autoGenerateClientRoutes, clientRoutes } = config.pointFiles;
                const src = config.isProd ? clientRoutes : autoGenerateClientRoutes;
                let html = template$1({
                    title: viewConfig.name,
                    hookContextMap: JSON.stringify(context),
                    src,
                    css: r === null || r === void 0 ? void 0 : r.css,
                    ssrHTML,
                    configJSON: JSON.stringify({
                        apiPre: args.config.apiPre,
                        diffPath: args.config.diffPath,
                    })
                });
                // use on dev
                if (args.vite && !config.isProd) {
                    html = yield args.vite.transformIndexHtml(pathname, html);
                }
                else {
                    html = transformIndexHtml(html, config);
                }
                ctx.body = html;
            }
            else {
                yield next();
            }
        });
    }

    function isDriver(path, tag) {
        const pathArr = path.split('/');
        return pathArr.includes(tag);
    }
    function aliasDriverRollupPlugin(c, env) {
        const { cwd, esmDirectory, driversDirectory } = c;
        const { outputClientDir, outputServerDir } = c.pointFiles;
        const envDriverOutputDir = env === 'server' ? outputServerDir : outputClientDir;
        const defaultFormat = esmDirectory;
        return {
            name: 'tarat-alias-driver',
            resolveId(source, importer, options) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!importer) {
                        return null;
                    }
                    if (isDriver(source, driversDirectory)) {
                        const resolution = yield this.resolve(source, importer, Object.assign({ skipSelf: true }, options));
                        if (!resolution || resolution.external) {
                            return resolution;
                        }
                        const aliasSource = resolution.id
                            .replace(cwd, envDriverOutputDir)
                            .replace(new RegExp(`\\/${driversDirectory}\\/`), `/${driversDirectory}/${defaultFormat}/`)
                            .replace(/\.ts$/, '.js');
                        const r2 = yield this.resolve(aliasSource, importer, Object.assign({ skipSelf: true }, options));
                        return r2;
                    }
                });
            },
        };
    }

    function pureDevCache(args) {
        const config = args.config;
        return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            for (const k in require.cache) {
                if (k.startsWith(config.pointFiles.outputDir)) {
                    delete require.cache[k];
                }
            }
            yield next();
        });
    }

    function setupBasicServer(c) {
        const app = new Koa__default["default"]();
        app.use(koaBody__default["default"]({
            multipart: true
        }));
        app.use(cors__default["default"]());
        app.use(staticServe__default["default"](c.publicDirectory));
        app.use((ctx, next) => __awaiter(this, void 0, void 0, function* () {
            yield next();
        }));
        app.use(unserializeWithFile());
        return app;
    }
    function startApp(app, c) {
        return __awaiter(this, void 0, void 0, function* () {
            const port = yield getPort__default["default"]({
                port: c.port ? c.port : process.env.PORT ? Number(process.env.PORT) : getPort.makeRange(9000, 9100)
            });
            app.listen(port);
            // const defaultView = getDefeaultRoute(c.pages)
            let address = getAddress();
            const allList = c.pages.filter(v => !v.dir).map(v => {
                return `
      ${v.name}:
      localhost: ${chalk__default["default"].green(`http://localhost:${port}${v.path}`)}
      ${address ? `ip: ${chalk__default["default"].green(`http://${address}:${port}${v.path}`)}` : ''}
    `;
            }).join('\n');
            logFrame(`
    Tarat App Server started at

    ${allList}
  `);
            return app;
        });
    }
    function createDevServer(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = setupBasicServer(c);
            app.use(pureDevCache({
                config: c
            }));
            app.use(taratMiddleware({
                config: c
            }));
            const vite$1 = yield vite.createServer({
                root: c.cwd,
                server: { middlewareMode: 'ssr' },
                plugins: [
                    tsconfigPaths__default["default"](),
                    Object.assign(Object.assign({}, aliasDriverRollupPlugin(c, 'client')), { enforce: 'pre' }),
                ],
                resolve: {
                    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
                    alias: [
                        {
                            find: 'tarat/core',
                            replacement: 'tarat/core/dist/core.client.js',
                        },
                    ]
                }
            });
            app.use(e2k__default["default"](vite$1.middlewares));
            app.use(page({
                config: c,
                pages: c.pages,
                vite: vite$1,
            }));
            startApp(app, c);
        });
    }
    function createServer(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = setupBasicServer(c);
            app.use(staticServe__default["default"](c.buildDirectory));
            app.use(taratMiddleware({
                config: c
            }));
            app.use(page({
                config: c,
                pages: c.pages,
            }));
            yield startApp(app, c);
            return app;
        });
    }

    const composeName = 'compose';
    /**
     * must use the export from tarat hoo
     */
    function isHookCaller(node) {
        return node.type === 'CallExpression' &&
            (node.callee.type === 'Identifier' && core.hookFactoryNames.includes(node.callee.name));
    }
    function isWritor(node) {
        return node.type === 'CallExpression' &&
            (node.callee.type === 'Identifier' && core.initiativeComputeHookFactoryNames.includes(node.callee.name));
    }
    function isComposeCaller(node) {
        return node.type === 'CallExpression' &&
            (node.callee.type === 'Identifier' && composeName === node.callee.name);
    }
    function getMemberExpressionKeys(m, keys = []) {
        if (m.property.type === 'Identifier') {
            const cur = m.property.name;
            switch (m.object.type) {
                case 'MemberExpression':
                    return getMemberExpressionKeys(m.object, keys.concat(cur));
                case 'Identifier':
                    return keys.concat(m.object.name).concat(cur);
                default:
                    console.error('[getMemberExpressionKeys] unexpect node type', m);
                    break;
            }
        }
        return keys;
    }
    /**
     * all drivers must be called at top
     */
    function collectHookVaraibles(BMNode) {
        const scopeMap = {};
        let hookIndex = 0;
        let composeIndex = 0;
        walk__namespace.ancestor(BMNode, {
            CallExpression(n, s, ancestor) {
                const isHook = isHookCaller(n);
                const isCompose = isComposeCaller(n);
                if (isHook || isCompose) {
                    const hookVariable = ancestor[ancestor.length - 2];
                    switch (hookVariable.type) {
                        case 'AssignmentExpression':
                            if (hookVariable.left.type === 'MemberExpression') {
                                const memberKeys = getMemberExpressionKeys(hookVariable.left);
                                if (isHook) {
                                    l.set(scopeMap, memberKeys, {
                                        type: 'hook',
                                        variablesNode: hookVariable.left,
                                        sourceHook: n,
                                        hookIndex: hookIndex++,
                                    });
                                }
                                else if (isCompose) {
                                    l.set(scopeMap, memberKeys, {
                                        type: 'compose',
                                        variablesNode: hookVariable.left,
                                        sourceHook: n,
                                        composeIndex: composeIndex++,
                                    });
                                }
                            }
                            break;
                        case 'VariableDeclarator':
                            {
                                let names = [];
                                switch (hookVariable.id.type) {
                                    case 'Identifier':
                                        names = [{
                                                name: hookVariable.id.name
                                            }];
                                        break;
                                    case 'ObjectPattern':
                                        hookVariable.id.properties.forEach(p => {
                                            switch (p.type) {
                                                case 'Property':
                                                    if (p.key.type === 'Identifier' && p.value.type === 'Identifier') {
                                                        names.push({
                                                            origin: p.key.name,
                                                            name: p.value.name,
                                                        });
                                                    }
                                                    break;
                                                case 'RestElement':
                                                    throw new Error('[ObjectPattern.RestElement] doesnt supported');
                                            }
                                        });
                                        break;
                                }
                                if (isHook) {
                                    names.forEach(({ origin, name }) => {
                                        l.set(scopeMap, name, {
                                            type: 'hook',
                                            variablesNode: hookVariable.id,
                                            sourceHook: n,
                                            hookIndex: hookIndex++,
                                            originIdentifier: origin,
                                        });
                                    });
                                }
                                else if (isCompose) {
                                    names.forEach(({ origin, name }) => {
                                        l.set(scopeMap, name, {
                                            type: 'compose',
                                            variablesNode: hookVariable.id,
                                            sourceHook: n,
                                            originIdentifier: origin,
                                            composeIndex: composeIndex++,
                                        });
                                    });
                                }
                            }
                            break;
                    }
                }
                // if (isCompose) {
                //   console.log('isCompose: ', ancestor);
                // }
            }
        });
        return scopeMap;
    }
    function findInScopeMap(s, targetHook) {
        let found;
        Object.keys(s).forEach(k => {
            if (!found) {
                if (s[k].sourceHook) {
                    // @ts-ignore
                    const match = ['start', 'end'].every(p => s[k].sourceHook[p] === targetHook[p]);
                    if (match) {
                        found = s[k];
                    }
                }
                else {
                    found = findInScopeMap(s[k], targetHook);
                }
            }
        });
        return found;
    }
    function findParentCallerHook(ancestor) {
        let i = ancestor.length - 2;
        let parent = ancestor[i];
        let parentCallerHook;
        while (i >= 0 && parent) {
            if (parent.type === 'CallExpression') {
                if (isHookCaller(parent)) {
                    parentCallerHook = parent;
                    break;
                }
            }
            i--;
            parent = ancestor[i];
        }
        return parentCallerHook;
    }
    function collectCallerWithAncestor(BMNode, scope) {
        const depsMap = new Map;
        walk__namespace.ancestor(BMNode, {
            CallExpression(n, s, ancestor) {
                var _a, _b;
                const { callee } = n;
                const hasArguments = ((_a = n['arguments']) === null || _a === void 0 ? void 0 : _a.length) > 0;
                let existSourceInScope;
                let lastCalleeName = '';
                switch (callee.type) {
                    // scene: "callee()"
                    case 'Identifier':
                        const calleeName = callee.name;
                        const scopeValue = l.get(scope, calleeName);
                        if (scopeValue) {
                            existSourceInScope = scopeValue.sourceHook;
                        }
                        lastCalleeName = calleeName;
                        break;
                    // scene: "aaa.bbb.callee()" or "otherComposeHookResult.xxxCallee()"
                    case 'MemberExpression':
                        const calleeKeys = getMemberExpressionKeys(callee);
                        existSourceInScope = (_b = l.get(scope, calleeKeys.slice(0, -1))) === null || _b === void 0 ? void 0 : _b.sourceHook;
                        lastCalleeName = calleeKeys[calleeKeys.length - 1];
                        break;
                }
                /** find which hook use this */
                if (existSourceInScope) {
                    const parentCallerHook = findParentCallerHook(ancestor);
                    if (parentCallerHook) {
                        const v1 = findInScopeMap(scope, existSourceInScope);
                        const parentCaller = findInScopeMap(scope, parentCallerHook);
                        if ((parentCaller === null || parentCaller === void 0 ? void 0 : parentCaller.type) === 'hook') {
                            let deps = depsMap.get(parentCaller.hookIndex);
                            if (!deps) {
                                deps = {
                                    get: new Set(),
                                    set: new Set(),
                                    ic: isWritor(parentCaller.sourceHook),
                                };
                                depsMap.set(parentCaller.hookIndex, deps);
                            }
                            switch (v1 === null || v1 === void 0 ? void 0 : v1.type) {
                                case 'hook':
                                    /**
                                     * @TODO
                                     * consider a case that calling writePrisma.remove() hasnt arguments but should set in "set"
                                     */
                                    if (hasArguments || isWritor(v1.sourceHook)) {
                                        deps.set.add(v1.hookIndex);
                                    }
                                    else {
                                        deps.get.add(v1.hookIndex);
                                    }
                                    break;
                                case 'compose':
                                    let name = v1.originIdentifier ? v1.originIdentifier : lastCalleeName;
                                    if (hasArguments) {
                                        deps.set.add(['c', v1.composeIndex, name]);
                                    }
                                    else {
                                        deps.get.add(['c', v1.composeIndex, name]);
                                    }
                                    break;
                            }
                        }
                    }
                }
            },
            // just support writeModel/writePrisma/cache
            Identifier(n, s, ancestor) {
                var _a;
                if (n.type === 'Identifier') {
                    const { name } = n;
                    const hook = l.get(scope, name);
                    if (hook && hook.type === 'hook') {
                        const parentCallerHook = findParentCallerHook(ancestor);
                        const fromValidParentCallExpression = ((_a = ancestor[ancestor.length - 2]) === null || _a === void 0 ? void 0 : _a.type) === 'CallExpression' &&
                            core.hookFactoryFeatures.withSource.includes(ancestor[ancestor.length - 2].callee.name);
                        if (parentCallerHook &&
                            parentCallerHook.callee.type === 'Identifier' &&
                            core.hookFactoryFeatures.withSource.includes(parentCallerHook.callee.name) &&
                            fromValidParentCallExpression) {
                            const parentCaller = findInScopeMap(scope, parentCallerHook);
                            if ((parentCaller === null || parentCaller === void 0 ? void 0 : parentCaller.type) === 'hook') {
                                let deps = depsMap.get(parentCaller.hookIndex);
                                if (!deps) {
                                    deps = {
                                        get: new Set(),
                                        set: new Set(),
                                        ic: isWritor(parentCaller.sourceHook),
                                    };
                                    depsMap.set(parentCaller.hookIndex, deps);
                                }
                                if (deps.ic) {
                                    deps.set.add(hook.hookIndex);
                                }
                                else {
                                    deps.get.add(hook.hookIndex);
                                }
                            }
                        }
                    }
                }
            }
        });
        return depsMap;
    }
    function convertDepsToJSON(m) {
        const arr = [];
        for (const [k, v] of m.entries()) {
            const r = [
                v.ic ? 'ic' : 'h',
                k,
                [...v.get],
            ];
            if (v.set.size > 0) {
                r.push([...v.set]);
            }
            arr.push(r);
        }
        return arr;
    }
    function genIndexNameMap(scope) {
        return Object.keys(scope).map(name => {
            const v = scope[name];
            if (v.type === 'hook') {
                return [
                    v.hookIndex,
                    name
                ];
            }
        }).filter(Boolean);
    }
    function generateBMDepMaps(BMNode) {
        const scopeMap = collectHookVaraibles(BMNode);
        // console.log('scopeMap: ', scopeMap);
        const depsMap = collectCallerWithAncestor(BMNode, scopeMap);
        const nameMap = genIndexNameMap(scopeMap);
        return {
            nameMap, depsMap
        };
    }
    /**
     * BM defination: the function including above hook factory method.
     */
    function matchBMFunction(ast) {
        const BMNodes = [];
        function func(parentFuncNode, s, ancestor) {
            let found = false;
            walk__namespace.ancestor(parentFuncNode, {
                CallExpression(n) {
                    var _a;
                    if (!found) {
                        const r = isHookCaller(n);
                        if (r) {
                            found = true;
                            if (parentFuncNode.type === 'ArrowFunctionExpression') {
                                const declaration = ancestor[ancestor.length - 2];
                                if (!declaration.id) ;
                                if (declaration.id.type === 'Identifier') {
                                    BMNodes.push([parentFuncNode, declaration.id.name]);
                                }
                            }
                            else if (parentFuncNode.type === 'FunctionDeclaration') {
                                if (((_a = parentFuncNode.id) === null || _a === void 0 ? void 0 : _a.type) === 'Identifier') {
                                    BMNodes.push([parentFuncNode, parentFuncNode.id.name]);
                                }
                            }
                        }
                    }
                }
            });
        }
        walk__namespace.ancestor(ast, {
            FunctionDeclaration: func,
            ArrowFunctionExpression: func,
        });
        return BMNodes;
    }
    function parseDeps(hookCode) {
        // const ast: any = babelParse(hookCode, {
        //   sourceType: 'module'
        // });
        const ast = acorn.parse(hookCode, {
            ecmaVersion: 'latest',
            sourceType: 'module'
        });
        const BMFunctionNodes = matchBMFunction(ast);
        const allBMDeps = BMFunctionNodes.map((n, i) => {
            const { nameMap, depsMap } = generateBMDepMaps((Array.isArray(n) ? n[0] : n));
            const arr = convertDepsToJSON(depsMap);
            return {
                [n[1]]: {
                    names: nameMap,
                    deps: arr
                },
            };
        }).reduce((p, n) => Object.assign(p, n), {});
        return allBMDeps;
    }

    const injectTagStart = '/**. auto generated by tarat */';
    const injectTagEnd = '/** auto generated by tarat .*/';
    const autoGeneratedFileTag = '@@tarat generated file';
    const autoGeneratedTip = () => [
        '//',
        `// ${autoGeneratedFileTag}`,
        '// provide by @tarat',
        '// warning: auto generated by tarat.do not modifed this file',
        '//'
    ];

    function findDependentPrisma(c) {
        const schemaFiles = [];
        c.dependencyModules.forEach(moduleName => {
            const dir = path__namespace.join(c.cwd, 'node_modules', moduleName);
            const depSchemaPath = path__namespace.join(dir, c.buildDirectory, c.modelsDirectory, 'schema.prisma');
            const r2 = fs__namespace.existsSync(depSchemaPath);
            if (r2) {
                schemaFiles.push(depSchemaPath);
            }
        });
        return schemaFiles.map(filePath => fs__namespace.readFileSync(filePath).toString());
    }
    function pickExpectModel(schemaContents) {
        const contents = schemaContents.map(content => {
            return content.replace(/model \w+ {[\w\W\n]*?}/g, '');
        });
        return contents;
    }
    function lowerFirst(str) {
        return str ? str[0].toLowerCase() + str.substring(1) : str;
    }
    function getSourceReferrenceType(source, targetProp) {
        let type = '';
        source.fieldLines.forEach(line => {
            const row = line.split(' ').filter(Boolean).map(s => s.trim());
            if (!type && row[0] === targetProp) {
                type = row[1];
            }
        });
        if (!type) {
            throw new Error(`[getSourceReferrenceType] can not find ${targetProp} in source(name=${source.name})`);
        }
        return type;
    }
    function generateNewSchema(c, schemaContentArr, enhanceJSON) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const schemaStructArr = yield Promise.all(schemaContentArr.map((schemaContent) => __awaiter(this, void 0, void 0, function* () {
                const model = yield prismaInternals__namespace.getDMMF({
                    datamodel: schemaContent
                });
                const models = model.datamodel.models;
                const modelsStruct = models.map((n) => {
                    var _a;
                    const { name } = n;
                    const r = schemaContent.match(new RegExp(`model ${name} {[\\w\\W\\n]*?}`, 'g'));
                    return {
                        name,
                        fieldLines: ((_a = r === null || r === void 0 ? void 0 : r[0]) === null || _a === void 0 ? void 0 : _a.split('\n').slice(1, -1)) || []
                    };
                });
                return modelsStruct;
            })));
            const schemaStructArrFlat = schemaStructArr.flat();
            const manyToManyCenteralModels = [];
            if (enhanceJSON) {
                (_a = enhanceJSON.extraRelation) === null || _a === void 0 ? void 0 : _a.forEach(relation => {
                    const source = schemaStructArrFlat.find(t => t.name === relation.from.model);
                    const target = schemaStructArrFlat.find(t => t.name === relation.to.model);
                    if (!source || !target) {
                        throw new Error(`[generateNewSchema] cannot found the source (name=${relation.from.model}) or target (name=${relation.to.model})`);
                    }
                    // prisma doc:https://www.prisma.io/docs/concepts/components/prisma-schema/relations/one-to-one-relations
                    switch (relation.type) {
                        case '1:1':
                            {
                                source.fieldLines.push(`${relation.from.field} ${target.name}?`);
                                const type = getSourceReferrenceType(source, 'id');
                                target.fieldLines.push(`${lowerFirst(source.name)} ${source.name} @relation(fields: [${relation.to.field}], references:[id])`);
                                target.fieldLines.push(`${relation.to.field} ${type} @unique`);
                            }
                            break;
                        case '1:n':
                            {
                                source.fieldLines.push(`${relation.from.field} ${target.name}[]`);
                                target.fieldLines.push(`${lowerFirst(source.name)} ${source.name} @relation(fields: [${relation.to.field}], references:[id])`);
                                const type = getSourceReferrenceType(source, 'id');
                                target.fieldLines.push(`${relation.to.field} ${type}`);
                            }
                            break;
                        case 'n:1':
                            {
                                const type = getSourceReferrenceType(source, 'id');
                                source.fieldLines.push(`${lowerFirst(target.name)} ${target.name} @relation(fields: [${relation.from.field}], references:[id])`);
                                source.fieldLines.push(`${relation.from.field} ${type}`);
                                target.fieldLines.push(`${relation.to.field} ${source.name}[]`);
                            }
                            break;
                        case 'n:n':
                            {
                                const centeralModelName = `Many${source.name}ToMany${target.name}`;
                                const sourceReferType = getSourceReferrenceType(source, 'id');
                                const targetReferType = getSourceReferrenceType(target, 'id');
                                const m2mModel = {
                                    name: centeralModelName,
                                    fieldLines: [
                                        `${lowerFirst(source.name)} ${source.name} @relation(fields: [${relation.from.field}], references: [id])`,
                                        `${relation.from.field} ${sourceReferType}`,
                                        `${lowerFirst(target.name)} ${target.name} @relation(fields: [${relation.to.field}], references: [id])`,
                                        `${relation.to.field} ${targetReferType}`,
                                        `@@id([${relation.from.field}, ${relation.to.field}])`
                                    ]
                                };
                                manyToManyCenteralModels.push(m2mModel);
                                source.fieldLines.push(`${relation.from.field} ${m2mModel.name}[]`);
                                target.fieldLines.push(`${relation.to.field} ${m2mModel.name}[]`);
                            }
                            break;
                        default:
                            const text = relation.type ? `[generateNewSchema] unexpected relation type "${relation.type}"` : `[generateNewSchema] must specific a relation type in [ 1:1, 1:n, n:1, n:n]`;
                            throw new Error(text);
                    }
                });
            }
            const newSchemaContent = schemaStructArrFlat.concat(manyToManyCenteralModels).map(m => {
                return [
                    `model ${m.name} {`,
                    ...m.fieldLines,
                    '}'
                ].join('\n');
            }).join('\n');
            return newSchemaContent;
        });
    }
    function readExsitPrismaPart(c) {
        const modelsDir = path__namespace.join(c.cwd, c.modelsDirectory);
        const existPrismaParts = [];
        fs__namespace.readdirSync(modelsDir).forEach(file => {
            if (new RegExp(`${c.prismaModelPart}$`).test(file)) {
                const schema = fs__namespace.readFileSync(path__namespace.join(modelsDir, file)).toString();
                existPrismaParts.push(schema);
            }
        });
        return existPrismaParts;
    }
    function generateSchemaFile(file, str) {
        return __awaiter(this, void 0, void 0, function* () {
            const lines = autoGeneratedTip().concat(str).join('\n');
            const formatResult = yield prismaInternals__namespace.formatSchema({ schema: lines });
            fs__namespace.writeFileSync(file, (formatResult === null || formatResult === void 0 ? void 0 : formatResult.trimEnd()) + os__default["default"].EOL);
        });
    }
    function composeSchema(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const { modelEnhanceFile: enhanceFile, modelTargetFile: targetFile } = c.pointFiles;
            let enhanceJSON;
            if (fs__namespace.existsSync(enhanceFile)) {
                enhanceJSON = loadJSON(enhanceFile);
            }
            if (c.model.engine === 'prisma') {
                const taratPrismas = findDependentPrisma(c);
                const partSchema = path__namespace.join(c.cwd, c.modelsDirectory, `schema.${c.prismaModelPart}`);
                if (!fs__namespace.existsSync(partSchema) && taratPrismas.length > 0) {
                    shelljs.cp(targetFile, partSchema);
                }
                const existPrismaPart = readExsitPrismaPart(c);
                /**
                 * if detect the dependent prisma, must backup orignal schema.prisma
                 */
                if (taratPrismas.length > 0) {
                    const newSchemaContent = yield generateNewSchema(c, existPrismaPart.concat(taratPrismas), enhanceJSON);
                    const existPrismaPartWithoutModels = pickExpectModel(existPrismaPart);
                    yield generateSchemaFile(targetFile, [
                        '// original writing schema',
                        ...existPrismaPartWithoutModels,
                        '// auto composing schema ',
                        newSchemaContent,
                    ]);
                }
            }
        });
    }
    const referrenceHookTemp = (arg) => `
${autoGeneratedTip().join('\n')}
export { default } from '${arg.path}'
`;
    function generateReferrenceDrivers(c, h) {
        return __awaiter(this, void 0, void 0, function* () {
            const curDriversDir = path__namespace.join(c.cwd, c.driversDirectory, c.composeDriversDirectory);
            if (!fs__namespace.existsSync(curDriversDir) && h.length > 0) {
                fs__namespace.mkdirSync(curDriversDir);
            }
            yield Promise.all(h.map(obj => new Promise((res, rej) => {
                const code = referrenceHookTemp({ path: obj.modulePath });
                const f = path__namespace.join(curDriversDir, `${obj.name}${c.ts ? '.ts' : '.js'}`);
                if (fs__namespace.existsSync(f)) {
                    const existCode = fs__namespace.readFileSync(f).toString();
                    if (equalFileContent(code, existCode)) {
                        return res();
                    }
                }
                fs__namespace.writeFile(f, code, (err) => {
                    if (err) {
                        rej(err);
                    }
                    else {
                        res();
                    }
                });
                // fs.writeFileSync(f, code)
            })));
        });
    }
    function composeDriver(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const dependencyDrivers = [];
            c.dependencyModules.forEach(moduleName => {
                const dir = path__namespace.join(c.cwd, 'node_modules', moduleName);
                const distDriversDir = path__namespace.join(dir, c.buildDirectory, c.driversDirectory);
                if (!fs__namespace.existsSync(distDriversDir)) {
                    console.error(`[composeDriver] hasnt drivers in "${moduleName}/${c.buildDirectory}/${c.driversDirectory}"`);
                    return;
                }
                fs__namespace.readdirSync(distDriversDir)
                    .filter(f => /\.js$/.test(f) && !/deps\.js$/.test(f))
                    .forEach(f => {
                    const { name } = path__namespace.parse(f);
                    let driverName = name;
                    if (dependencyDrivers.find(v => v.name === driverName)) {
                        driverName = camelCase.camelCase(`${moduleName}.${name}`);
                        if (dependencyDrivers.find(v => v.name === driverName)) {
                            throw new Error('[tarat] can not handle hook name confict betwwen all dependency modules');
                        }
                    }
                    dependencyDrivers.push({
                        name: driverName,
                        modulePath: `${moduleName}/${c.buildDirectory}/${c.driversDirectory}/${name}`
                    });
                });
            });
            yield generateReferrenceDrivers(c, dependencyDrivers);
        });
    }

    function tsWalker(sourceFile, nodes, visitor, ancestor = []) {
        nodes.forEach(n => {
            const children = n.getChildren(sourceFile);
            const newAncestor = ancestor.concat(n);
            children.forEach(cn => {
                if (visitor[cn.kind]) {
                    visitor[cn.kind](cn, newAncestor);
                }
            });
            tsWalker(sourceFile, children, visitor, newAncestor);
        });
    }
    const removedFunctionBodyPlaceholder = `() => { /*! can not invoked in current runtime */ }`;
    function removeFunctionBody(code, names) {
        const sourceFile = typescript.createSourceFile('cfb.ts', code, typescript.ScriptTarget.ESNext);
        const nodes = sourceFile.getChildren();
        const bodyRangeArr = [];
        tsWalker(sourceFile, nodes, {
            [typescript.SyntaxKind.CallExpression]: (n, a) => {
                const calleeName = n.expression.getText(sourceFile);
                // console.log('n: ', n);
                if (names.includes(calleeName) && n.arguments.length) {
                    // console.log('n2: ', code.substring(n.pos, n.end));
                    n.arguments.forEach(n => {
                        switch (n.kind) {
                            case typescript.SyntaxKind.ArrowFunction:
                            case typescript.SyntaxKind.FunctionExpression:
                                const { pos, end } = n;
                                bodyRangeArr.push([pos, end]);
                                break;
                            case typescript.SyntaxKind.Identifier:
                                /** @TODO: Identifier maybe a function variable. should climb current scope */
                                break;
                        }
                    });
                }
            }
        });
        let gap = 0;
        let newCode = code;
        bodyRangeArr.forEach(([st, ed], i) => {
            newCode =
                newCode.substring(0, st - gap) +
                    removedFunctionBodyPlaceholder +
                    newCode.substring(ed - gap);
            gap += ed - st - removedFunctionBodyPlaceholder.length;
        });
        return newCode;
    }

    const templateFile = './routesTemplate.ejs';
    const templateFilePath = path__namespace.join(__dirname, templateFile);
    const templateClientFile = './routesClientTemplate.ejs';
    const templateClientFilePath = path__namespace.join(__dirname, templateClientFile);
    const defaultTsconfigJSON = path__namespace.join(__dirname, './defaultTsconfig.json');
    const routesTemplate = ejs.compile(fs__namespace.readFileSync(templateFilePath).toString());
    const routesClientTemplate = ejs.compile(fs__namespace.readFileSync(templateClientFilePath).toString());
    /**
     * searches for tsconfig.json file starting in the current directory, if not found
     * use the default tsconfig.json provide by tarat
     */
    function getTSConfigPath(c) {
        const tsconfigFile = path__namespace.join(c.cwd, 'tsconfig.json');
        if (fs__namespace.existsSync(tsconfigFile)) {
            return tsconfigFile;
        }
        console.log(`[getTSConfigPath] using default tsconfig setting: ${defaultTsconfigJSON}`);
        return defaultTsconfigJSON;
    }
    function getPostCssConfigPath(c) {
        let pp = '';
        fs__namespace.readdirSync(c.cwd).forEach(f => {
            if (/postcss\.config/.test(f)) {
                if (pp) {
                    throw new Error(`[getPostCssConfigPath] duplcate postcsss.config file exist in ${c.cwd}`);
                }
                else {
                    pp = path__namespace.join(c.cwd, f);
                }
            }
        });
        if (pp && fs__namespace.existsSync(pp)) {
            return pp;
        }
    }
    function build$1(c, op) {
        return __awaiter(this, void 0, void 0, function* () {
            let bundle;
            try {
                bundle = yield rollup.rollup(op.input);
                yield generateOutput(c, bundle, op.output);
            }
            catch (e) {
                console.error(e);
            }
            finally {
                yield (bundle === null || bundle === void 0 ? void 0 : bundle.close());
            }
        });
    }
    function generateOutput(c, bundle, op) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { output } = yield bundle.generate(op);
            for (const chunkOrAsset of output) {
                if (chunkOrAsset.type === 'asset') {
                    const target = path__namespace.join(op.dir || c.pointFiles.outputDir, chunkOrAsset.fileName);
                    fs__namespace.writeFileSync(target, chunkOrAsset.source);
                }
                else if (chunkOrAsset.type === 'chunk') {
                    let dir = op.dir;
                    if (!op.dir) {
                        dir = (_a = op.file) === null || _a === void 0 ? void 0 : _a.replace(chunkOrAsset.fileName, '');
                    }
                    if (dir && !fs__namespace.existsSync(dir)) {
                        fs__namespace.mkdirSync(dir);
                    }
                    if (op.file) {
                        fs__namespace.writeFileSync(op.file, chunkOrAsset.code);
                    }
                    else {
                        fs__namespace.writeFileSync(path__namespace.join(dir, chunkOrAsset.fileName), chunkOrAsset.code);
                    }
                }
            }
        });
    }
    function getPlugins(input, c) {
        const { runtime, alias, css, mode, target = 'node' } = input;
        console.log('runtime: ', runtime);
        const plugins = [
            runtime ? aliasDriverRollupPlugin(c, runtime) : undefined,
            replace__default["default"]({
                preventAssignment: true,
                'process.env.NODE_ENV': mode === 'build' ? '"production"' : '"development"'
            }),
            rollupAlias__default["default"]({
                entries: Object.assign({ '@': c.cwd }, (alias || {}))
            }),
            json__default["default"](),
            commonjs__default["default"](),
            resolve__default["default"]({
                browser: target === 'browser',
                extensions: ['.jsx', '.tsx', '.js', '.cjs', '.mjs', '.ts', '.json']
            }),
            pluginBabel.babel({
                exclude: 'node_modules/**',
                presets: ['@babel/preset-react']
            }),
            postcss__default["default"]({
                config: {
                    path: getPostCssConfigPath(c),
                    ctx: {}
                },
                extract: typeof css === 'string' ? css.replace(c.pointFiles.outputDir, '').replace(/^\//, '') : css, // only support relative path
            }),
            autoExternal__default["default"]({
                peerDependencies: target !== 'browser',
                dependencies: mode === 'dev' && target !== 'browser'
            }),
            c.ts ? tsPlugin__default["default"]({
                clean: true,
                tsconfig: getTSConfigPath(c)
            }) : undefined,
        ].filter(Boolean);
        return plugins;
    }
    function getEntryFile(c) {
        let f = path__namespace.join(c.cwd, c.appDirectory, c.entryServer);
        const tsx = '.tsx';
        const jsx = '.jsx';
        if (c.ts && fs__namespace.existsSync(`${f}${tsx}`)) {
            return {
                file: `${f}${tsx}`,
                ext: tsx
            };
        }
        if (!c.ts && fs__namespace.existsSync(`${f}${jsx}`)) {
            return {
                file: `${f}${jsx}`,
                ext: jsx
            };
        }
    }
    function upperFirst(s) {
        s = s.replace(/\:|-/g, '_');
        return s ? (s[0].toUpperCase() + s.substring(1)) : '';
    }
    function generateRoutesContent(routes, depth = 0, parentNmae = '') {
        const pathObj = {};
        routes.forEach(r => {
            if (pathObj[r.path]) {
                const exist = pathObj[r.path];
                if (exist.dir) {
                    Object.assign(exist, {
                        dir: false,
                        file: r.file,
                        id: r.id
                    });
                }
                else {
                    Object.assign(exist, {
                        dir: false,
                        children: r.children
                    });
                }
            }
            else {
                pathObj[r.path] = Object.assign({}, r);
            }
        });
        const routeArr = Object.values(pathObj).map((r, i) => {
            let Cpt = '';
            let element = '';
            if (r.dir) ;
            else {
                if (r.file) {
                    Cpt = `${upperFirst(parentNmae)}${upperFirst(r.name)}`;
                }
                else {
                    const childIndex = r.children.find(c => c.index);
                    Cpt = childIndex ? `${upperFirst(parentNmae)}${upperFirst(r.name) || '/'}${upperFirst(childIndex.name)}` : '';
                }
                if (Cpt) {
                    element = `element={<${Cpt} />}`;
                }
            }
            return [
                r.index ? `<Route index ${element} >` : `<Route path="${r.name}" ${element} >`,
                r.children.length > 0 ? generateRoutesContent(r.children, depth + 1, r.name) : '',
                `</Route>`
            ].join('\n');
        });
        return routeArr.join('\n');
    }
    function generateRoutesImports(routes, parentNmae = '') {
        let importsArr = [];
        routes.forEach(r => {
            if (!r.dir && r.file) {
                importsArr.push([
                    `${upperFirst(parentNmae)}${upperFirst(r.name)}`,
                    r.file,
                ]);
            }
            if (r.children) {
                const childImports = generateRoutesImports(r.children, r.name);
                importsArr.push(...childImports);
            }
        });
        return importsArr;
    }
    function implicitImportPath(path, ts) {
        if (ts) {
            return path.replace(/\.ts(x?)$/, '');
        }
        return path;
    }
    function buildServerRoutes(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const { outputDir, autoGenerateServerRoutes, distServerRoutes, autoGenerateClientRoutes, outputAppServerDir, distServerRoutesCSS } = c.pointFiles;
            const routesTreeArr = defineRoutesTree(c.pages);
            const imports = generateRoutesImports(routesTreeArr);
            const importsWithAbsolutePathClient = imports.map(([n, f]) => {
                return `import ${n} from '${implicitImportPath(path__namespace.join(c.cwd, f), c.ts)}'`;
            }).join('\n');
            const importsWithAbsolutePathServer = imports.map(([n, f]) => {
                return `import ${n} from '${implicitImportPath(path__namespace.join(c.cwd, f), c.ts)}'`;
            }).join('\n');
            const includingTs = imports.some(([n, f]) => /\.ts(x?)$/.test(f));
            if (includingTs && !c.ts) {
                throw new Error('[tarat] you are using ts file. please specific "ts:true" in tarat.config.js');
            }
            const r = generateRoutesContent(routesTreeArr);
            let entryCSSPath = '';
            if (c.entryCSS) {
                entryCSSPath = `import "${c.entryCSS}"`;
            }
            const routesStr = routesTemplate({
                imports: importsWithAbsolutePathServer,
                entryCSSPath,
                routes: r
            });
            fs__namespace.writeFileSync(autoGenerateServerRoutes, prettier__namespace.format(routesStr));
            const routesStr2 = routesClientTemplate({
                imports: importsWithAbsolutePathClient,
                routes: r
            });
            // generate for vite.js
            fs__namespace.writeFileSync(autoGenerateClientRoutes, prettier__namespace.format(routesStr2));
            const myPlugins = getPlugins({
                css: distServerRoutesCSS,
                mode: 'dev',
                runtime: 'server'
            }, c);
            /**
             * compile routes.server to js
             * routes.client doesnt need becase of vite
             */
            const inputOptions = {
                input: {
                    cache: false,
                    input: autoGenerateServerRoutes,
                    plugins: myPlugins
                },
                output: {
                    file: distServerRoutes,
                    format: 'commonjs',
                }
            };
            yield build$1(c, inputOptions);
        });
    }
    function buildEntryServer(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = getEntryFile(c);
            if (r === null || r === void 0 ? void 0 : r.file) {
                const { distEntryJS: distEntry, distEntryCSS: distEntryCss } = c.pointFiles;
                const inputOptions = {
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
                };
                yield build$1(c, inputOptions);
                return {
                    entry: distEntry,
                    css: distEntryCss
                };
            }
        });
    }
    /**
     * make sure hook will import the same module type
     */
    function replaceImportDriverPath(sourceFile, format, env) {
        const reg = /from (?:'|")([\w\/-]*)(?:'|")/g;
        const reg2 = /require\((?:'|")([\w\/-]*)(?:'|")/g;
        const code = fs__namespace.readFileSync(sourceFile).toString();
        const r = code.match(reg);
        const r2 = code.match(reg2);
        const importModules = r || r2;
        if (importModules && importModules.length > 0 &&
            importModules.some(m => /\/drivers\/[\w-]+/.test(m))) {
            const c2 = code.replace(/\/(drivers)\/([\w-]+)/, `/${env}/$1/${format}/$2`);
            fs__namespace.writeFileSync(sourceFile, c2);
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
    function removeUnusedImports(sourceFile) {
        const code = fs__namespace.readFileSync(sourceFile).toString();
        let ast;
        try {
            ast = acorn.parse(code, { sourceType: 'module', ecmaVersion: 'latest' });
        }
        catch (e) {
            console.error(`[removeUnusedImports] acorn parse error`, e);
            return;
        }
        const removeImportRange = [];
        if (ast.type === 'Program') {
            ast.body.forEach((n) => {
                switch (n.type) {
                    case 'ImportDeclaration':
                        {
                            const w2 = n.specifiers.map(s => s.local.name);
                            let r = false;
                            walk__namespace.simple(ast, {
                                Identifier(n) {
                                    r = r || w2.includes(n.name);
                                },
                                ExportNamedDeclaration(n) {
                                    traverse(n, (pathArr, value) => {
                                        if (value.type === 'Identifier' && last(pathArr) === 'local') {
                                            r = r || w2.includes(value.name);
                                        }
                                    });
                                }
                            });
                            if (!r) {
                                removeImportRange.push([n.start, n.end]);
                            }
                        }
                        break;
                }
            });
        }
        let gap = 0;
        let newCode = code;
        removeImportRange.forEach(([st, ed]) => {
            newCode =
                newCode.substring(0, st - gap) +
                    newCode.substring(ed - gap);
            gap += ed - st;
        });
        fs__namespace.writeFileSync(sourceFile, newCode);
    }
    function clearFunctionBodyEsbuildPlugin(names) {
        return {
            name: 'clear tarat runtime function body',
            setup(build) {
                /** @TODO should match more explicit */
                build.onLoad({ filter: /drivers\// }, args => {
                    const code = fs__namespace.readFileSync(args.path).toString();
                    const newCode2 = removeFunctionBody(code, names);
                    return {
                        contents: newCode2,
                        loader: /\.ts$/.test(args.path) ? 'ts' : 'js'
                    };
                });
            },
        };
    }
    function aliasAtCodeToCwd(c) {
        return {
            name: 'aliasAtCodeToCwd',
            setup(build) {
                build.onLoad({ filter: /drivers\// }, args => {
                    const code = fs__namespace.readFileSync(args.path).toString();
                    const newCode2 = code.replace(/@\//, c.cwd + '/');
                    return {
                        contents: newCode2,
                        loader: /\.ts$/.test(args.path) ? 'ts' : 'js'
                    };
                });
            },
        };
    }
    function esbuildDrivers(c, outputDir, format, env) {
        return __awaiter(this, void 0, void 0, function* () {
            const { drivers } = c;
            let includingTs = false;
            const points = [];
            drivers.map(h => {
                const { filePath, name } = h;
                if (/\.(m)?(j|t)s$/.test(filePath)) {
                    points.push(filePath);
                    includingTs = /\.ts(x)?$/.test(filePath) || includingTs;
                }
            });
            if (includingTs && !c.ts) {
                throw new Error('[tarat] you are using ts file. please specific ts:true in tarat.config.js');
            }
            const buildOptions = {
                entryPoints: points,
                bundle: true,
                outdir: outputDir,
                platform: 'node',
                format,
                treeShaking: true,
                external: [
                    ...Object.keys(c.pacakgeJSON.dependencies || {}),
                    ...Object.keys(c.pacakgeJSON.devDependencies || {}),
                    ...Object.keys(c.pacakgeJSON.peerDependencies || {})
                ],
                plugins: [
                    aliasAtCodeToCwd(c)
                ],
            };
            if (env === 'client') {
                buildOptions.plugins.push(clearFunctionBodyEsbuildPlugin(core.hookFactoryFeatures.serverOnly));
            }
            // check tsconfig
            if (includingTs) {
                buildOptions.tsconfig = getTSConfigPath(c);
            }
            yield esbuild__namespace.build(buildOptions);
            if (fs__namespace.existsSync(outputDir)) {
                traverseDir(outputDir, (obj) => {
                    if (!obj.isDir) {
                        removeUnusedImports(obj.path);
                        if (env) {
                            replaceImportDriverPath(obj.path, format, env);
                        }
                    }
                });
            }
        });
    }
    function buildDTS(c, filePath, outputFile) {
        const tsconfigPath = getTSConfigPath(c);
        loadJSON(tsconfigPath);
        const options = {
            input: {
                input: filePath,
                plugins: [
                    dts__default["default"]()
                ]
            },
            output: {
                file: outputFile,
                format: 'esm'
            }
        };
        return build$1(c, options);
    }
    function driversType(c, outputDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const { drivers, driversDirectory } = c;
            const cwdDirversDir = path__namespace.join(c.cwd, driversDirectory);
            const generateFiles = [];
            yield Promise.all(drivers.filter(({ filePath }) => /\.ts$/.test(filePath)).map((h) => __awaiter(this, void 0, void 0, function* () {
                const { filePath, name, dir } = h;
                const relativePath = path__namespace.relative(cwdDirversDir, dir);
                const destDir = path__namespace.join(outputDir, relativePath);
                const destFile = path__namespace.join(destDir, `${name}.d.ts`);
                generateFiles.push({
                    name,
                    destDir,
                    relativePath,
                    destFile,
                });
                yield buildDTS(c, filePath, destFile);
            })));
            return generateFiles;
        });
    }
    /**
     * for server side running
     */
    function buildDrivers(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const { outputClientDriversDir, outputServerDriversDir, outputDriversDir, } = c.pointFiles;
            const { esmDirectory, cjsDirectory } = c;
            // 1.must build source dir first prevent to traverse below children dir 
            yield esbuildDrivers(c, outputDriversDir, 'esm');
            // 2.run after source building
            yield Promise.all([
                // cjs
                esbuildDrivers(c, path__namespace.join(outputClientDriversDir, cjsDirectory), 'cjs', 'client'),
                esbuildDrivers(c, path__namespace.join(outputServerDriversDir, cjsDirectory), 'cjs', 'server'),
                // esm
                esbuildDrivers(c, path__namespace.join(outputClientDriversDir, esmDirectory), 'esm', 'client'),
                esbuildDrivers(c, path__namespace.join(outputServerDriversDir, esmDirectory), 'esm', 'server'),
            ]);
            if (c.ts) {
                try {
                    const files = yield driversType(c, outputDriversDir);
                    files.forEach(({ name, destFile, relativePath }) => {
                        [cjsDirectory, esmDirectory].forEach(formatDir => {
                            [outputClientDriversDir, outputServerDriversDir].forEach(envDir => {
                                const dir = path__namespace.join(envDir, formatDir, relativePath);
                                if (!fs__namespace.existsSync(dir)) {
                                    fs__namespace.mkdirSync(dir);
                                }
                                shelljs.cp(destFile, dir);
                            });
                        });
                    });
                }
                catch (e) {
                    console.error(e);
                    logFrame(chalk__default["default"].red('build hook dts fail'));
                }
            }
        });
    }
    function buildModelIndexes(c) {
        return __awaiter(this, void 0, void 0, function* () {
            if (c.model.engine === 'prisma') {
                const schemaFile = path__namespace.join(c.cwd, c.modelsDirectory, c.targetSchemaPrisma);
                const schemaIndexesFile = path__namespace.join(c.cwd, c.modelsDirectory, c.schemaIndexes + (c.ts ? '.ts' : '.js'));
                if (fs__namespace.existsSync(schemaFile)) {
                    try {
                        const model = yield prismaInternals__namespace.getDMMF({
                            datamodel: fs__namespace.readFileSync(schemaFile).toString()
                        });
                        const models = model.datamodel.models;
                        const indexesStr = models.map(m => {
                            return `export const ${m.name} = "${lowerFirst$1(m.name)}"`;
                        }).join('\n');
                        fs__namespace.writeFileSync(schemaIndexesFile, prettier__namespace.format(indexesStr));
                    }
                    catch (e) {
                        console.error('[buildModelIndexes] building indexes');
                    }
                }
            }
        });
    }

    function buildClientRoutes(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const { outputDir, autoGenerateClientRoutes, clientRoutes, outputAppClientDir, clientRoutesCSS } = c.pointFiles;
            const myPlugins = getPlugins({
                css: clientRoutesCSS,
                mode: 'build',
                target: 'browser',
                alias: {
                    'tarat/core': 'tarat/core/dist/index.client.js',
                },
                runtime: 'client'
            }, c);
            const pkg = loadJSON(path__namespace.join(c.cwd, 'package.json'));
            const op = {
                input: {
                    input: autoGenerateClientRoutes,
                    plugins: myPlugins,
                },
                output: {
                    file: clientRoutes,
                    name: `${pkg.name}TaratApp`,
                    format: 'umd',
                    // manualChunks: {
                    //   dll: [
                    //     'react',
                    //     'react-dom',
                    //     'tarat/core',
                    //     'tarat/connect'
                    //   ]
                    // }
                }
            };
            yield build$1(c, op);
        });
    }
    function buildViews(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const { outputViewsDir, } = c.pointFiles;
            const originalViewsDir = path__namespace.join(c.cwd, c.viewsDirectory);
            const queue = [];
            const originDirverDir = path__namespace.join(c.cwd, c.driversDirectory);
            traverseDir(originalViewsDir, f => {
                const wholePath = path__namespace.join(originalViewsDir, f.file);
                if (f.isDir) {
                    if (!fs__namespace.existsSync(wholePath)) {
                        fs__namespace.mkdirSync(wholePath);
                    }
                }
                else if (/\.(j|t)sx$/.test(f.file)) {
                    queue.push(new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                        const file = f.file;
                        const parsed = path__namespace.parse(file);
                        const relativePath = path__namespace.relative(originalViewsDir, f.dir);
                        const input = path__namespace.join(originalViewsDir, relativePath, file);
                        const outputJS = path__namespace.join(outputViewsDir, relativePath, `${parsed.name}.js`);
                        const outputCSS = path__namespace.join(outputViewsDir, relativePath, `${parsed.name}.css`);
                        const externalDrivers = fs__namespace.existsSync(originDirverDir) ? fs__namespace.readdirSync(originDirverDir).map(f => {
                            return path__namespace.join(c.cwd, c.driversDirectory, f);
                        }) : [];
                        const op = {
                            input: {
                                input,
                                plugins: getPlugins({
                                    css: outputCSS,
                                    mode: 'build',
                                    target: 'unit',
                                    alias: {
                                        'tarat/core': 'tarat/core/dist/index.client.js',
                                    }
                                }, c),
                                external: externalDrivers // use other external parameter types will conflict with auto-external plugins
                            },
                            output: {
                                file: outputJS,
                                format: 'esm'
                            }
                        };
                        yield build$1(c, op);
                        resolve();
                    })));
                }
            });
            yield Promise.all(queue);
        });
    }

    function template(origin, deps, assigns, filePath) {
        return `${origin}
${injectTagStart}
${filePath}
${deps}
${assigns}
${injectTagEnd}
`;
    }
    function cleanOriginalCodeTag(code) {
        const rows = code.split('\n');
        let si = -1;
        let ei = -1;
        rows.forEach((r, i) => {
            if (r.trim() === injectTagStart) {
                si = i;
            }
            else if (r.trim() === injectTagEnd) {
                ei = i;
            }
        });
        if (si >= 0 && ei >= 0) {
            return rows.slice(0, si).concat(rows.slice(ei + 1)).join('\n');
        }
        return code;
    }
    function injectDeps(c, targetFile) {
        const code = fs__namespace.readFileSync(targetFile).toString();
        const parsed = path__namespace.parse(targetFile);
        const depsJSONPath = path__namespace.join(c.pointFiles.outputDriversDir, `${parsed.name}.deps.json`);
        if (fs__namespace.existsSync(depsJSONPath)) {
            const depsJSON = loadJSON(depsJSONPath);
            const AUTO_PARSER = 'autoParser';
            const arr = Object.keys(depsJSON).map(funcName => {
                return `Object.assign(${funcName}, {
  __deps__: ${AUTO_PARSER}.${funcName}.deps,
  __names__: ${AUTO_PARSER}.${funcName}.names,
  __name__: "${funcName}" })`;
            });
            const codeIncludingDeps = template(cleanOriginalCodeTag(code), `const ${AUTO_PARSER} = ${JSON.stringify(depsJSON).replace(/"/g, "'")}`, arr.join('\n').replace(/"/g, "'"), `// location at:${targetFile}`);
            const codeIncludingDepsWithFormat = prettier__namespace.format(codeIncludingDeps, {
                parser: 'typescript'
            });
            if (!equalFileContent(code, codeIncludingDepsWithFormat) &&
                !(new RegExp(autoGeneratedFileTag).test(code))) {
                fs__namespace.writeFileSync(targetFile, codeIncludingDepsWithFormat);
            }
        }
        else {
            throw new Error(`[injectDeps] not found deps.json with path "${depsJSONPath}"`);
        }
    }
    /** @TODO 1.integrated to the vite.plugin 2.upgrade to typescript */
    function generateHookDeps(c) {
        const { outputClientDriversDir, outputServerDriversDir, outputDriversDir, } = c.pointFiles;
        const { esmDirectory, cjsDirectory } = c;
        const driversDir = outputDriversDir;
        path__namespace.join(c.cwd, c.driversDirectory);
        fs__namespace.readdirSync(driversDir).forEach(f => {
            const compiledFile = path__namespace.join(driversDir, f);
            const name = f.replace(/\.js$/, '');
            if (/\.js$/.test(f)) {
                const code = fs__namespace.readFileSync(compiledFile).toString();
                const deps = parseDeps(code);
                const devDriversDir = path__namespace.join(c.pointFiles.outputDriversDir);
                if (!fs__namespace.existsSync(devDriversDir)) {
                    tryMkdir(devDriversDir);
                }
                // json in tarat: generate deps.json
                fs__namespace.writeFileSync(path__namespace.join(c.pointFiles.outputDriversDir, `${name}.deps.json`), (JSON.stringify(deps)));
                // modify original hook file
                injectDeps(c, compiledFile);
                [outputClientDriversDir, outputServerDriversDir].forEach(envDir => {
                    [esmDirectory, cjsDirectory].forEach(formatDir => {
                        const cjsOutputFile = path__namespace.join(envDir, formatDir, `${name}.js`);
                        injectDeps(c, cjsOutputFile);
                    });
                });
            }
        });
    }

    function buildEverything(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const cost = time();
            yield buildModelIndexes(c).then(() => {
                logFrame(`build modelIndexes end. cost ${chalk__default["default"].green(cost())} sec`);
            });
            yield buildDrivers(c).then(() => {
                generateHookDeps(c);
                logFrame(`build drivers end. cost ${chalk__default["default"].green(cost())} sec`);
            });
            // must executeafter driver building
            yield Promise.all([
                buildServerRoutes(c).then(() => {
                    logFrame(`build routes end. cost ${chalk__default["default"].green(cost())} sec`);
                }),
                buildEntryServer(c).then(() => {
                    logFrame(`build entryServer end. cost ${chalk__default["default"].green(cost())} sec`);
                })
            ]);
        });
    }
    function prepareDir(c) {
        emptyDirectory(c.pointFiles.outputDir);
        Object.entries(c.pointFiles).forEach(([name, path]) => {
            if (/Dir$/.test(name)) {
                tryMkdir(path);
            }
        });
        // append
        tryMkdir(path__namespace.join(c.pointFiles.outputDriversDir, c.esmDirectory));
        tryMkdir(path__namespace.join(c.pointFiles.outputDriversDir, c.cjsDirectory));
        tryMkdir(path__namespace.join(c.pointFiles.outputClientDriversDir, c.esmDirectory));
        tryMkdir(path__namespace.join(c.pointFiles.outputClientDriversDir, c.cjsDirectory));
        tryMkdir(path__namespace.join(c.pointFiles.outputServerDriversDir, c.esmDirectory));
        tryMkdir(path__namespace.join(c.pointFiles.outputServerDriversDir, c.cjsDirectory));
    }
    function startCompile(c) {
        return __awaiter(this, void 0, void 0, function* () {
            const cost = time();
            logFrame('prepare');
            prepareDir(c);
            yield buildEverything(c);
            const watchTarget = [
                path__namespace.join(c.cwd, c.appDirectory),
                path__namespace.join(c.cwd, c.driversDirectory),
                path__namespace.join(c.cwd, c.viewsDirectory),
            ];
            const watcher = chokidar__default["default"].watch(watchTarget, {
                persistent: true,
                ignoreInitial: true,
                awaitWriteFinish: {
                    stabilityThreshold: 100,
                    pollInterval: 100,
                },
            });
            const watcher2 = chokidar__default["default"].watch([
                path__namespace.join(c.cwd, c.modelsDirectory, c.targetSchemaPrisma)
            ], {
                persistent: true,
                ignoreInitial: true,
                awaitWriteFinish: {
                    stabilityThreshold: 100,
                    pollInterval: 100,
                },
            });
            watcher2.on('change', path => {
                buildModelIndexes(c).then(() => {
                    logFrame(`build modelIndexes end. cost ${chalk__default["default"].green(cost())} sec`);
                });
            });
            watcher
                .on('error', console.error)
                .on('change', (path) => {
                if (/(\.css|\.less|\.scss)$/.test(path)) {
                    return;
                }
                const cost = time();
                logFrame(`[change] re-run compiling from "${path}"`);
                readConfig({ cwd: c.cwd }).then(newConfig => {
                    return buildEverything(newConfig);
                }).then(() => {
                    logFrame(`[change] comipling ${chalk__default["default"].green(cost())} sec`);
                });
            })
                .on('add', (path) => {
                logFrame(`[add] ${chalk__default["default"].green('re-run compiling')}  from "${path}"`);
                readConfig({ cwd: c.cwd }).then(newConfig => {
                    buildEverything(newConfig);
                });
            })
                .on('unlink', (path) => {
                logFrame(`[unlink] ${chalk__default["default"].red('re-run compiling')}  from "${path}"`);
                readConfig({ cwd: c.cwd }).then(newConfig => {
                    buildEverything(newConfig);
                });
            });
            exitHook__default["default"](() => {
                console.log('[startCompile] exithook callback');
                watcher.close();
            });
        });
    }
    var dev = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
        const config = yield readConfig({
            cwd,
        });
        yield startCompile(config);
        composeSchema(config);
        composeDriver(config);
        yield createDevServer(config);
    });

    var build = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
        const config = yield readConfig({
            cwd,
            isProd: true,
        });
        const allCost = time();
        logFrame(('prepare dir and cp models'));
        prepareDir(config);
        composeSchema(config);
        composeDriver(config);
        if (fs__namespace.existsSync(path__namespace.join(cwd, config.modelsDirectory, config.targetSchemaPrisma))) {
            shelljs.cp(path__namespace.join(cwd, config.modelsDirectory, config.targetSchemaPrisma), path__namespace.join(config.pointFiles.outputModelsDir, config.targetSchemaPrisma));
        }
        logFrame(('build routes/entryServer/drivers'));
        const cost = time();
        yield buildEverything(config);
        logFrame((`build routes/entryServer/drivers end. cost ${chalk__default["default"].green(cost())} seconds`));
        logFrame(('build clientRoutes/views'));
        const cost2 = time();
        yield Promise.all([
            buildClientRoutes(config).then(() => {
                logFrame((`build ${chalk__default["default"].green('clientRoutes')} end. cost ${chalk__default["default"].green(cost2())} seconds`));
            }),
            buildViews(config).then(() => {
                logFrame((`build ${chalk__default["default"].green('views')} end. cost ${chalk__default["default"].green(cost2())} seconds`));
            }),
        ]);
        logFrame((`build end. cost ${chalk__default["default"].green(allCost())} seconds`));
    });

    function start(cwd) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield readConfig({
                cwd,
                isProd: true,
            });
            config.pointFiles = config.buildPointFiles;
            yield createServer(config);
        });
    }

    var any = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
        yield readConfig({
            cwd,
        });
    });

    const cac = cacFactory__default["default"]('tarat-server');
    const cwd = process.cwd();
    cac
        .command('dev', 'start service for development')
        .option('--port <port>', 'service port', {
        default: '9001'
    })
        .action((options) => __awaiter(void 0, void 0, void 0, function* () {
        dev(cwd);
    }));
    cac
        .command('build', 'compile current project')
        .action(() => __awaiter(void 0, void 0, void 0, function* () {
        build(cwd);
    }));
    cac
        .command('start', 'starting project as service')
        .action(() => __awaiter(void 0, void 0, void 0, function* () {
        start(cwd);
    }));
    cac
        .command('any')
        .action(() => __awaiter(void 0, void 0, void 0, function* () {
        any(cwd);
    }));
    cac.help();
    cac.version(pkg.version);
    cac.parse();

}));
//# sourceMappingURL=index.js.map
