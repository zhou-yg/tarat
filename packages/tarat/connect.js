(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('tarat/core'), require('swr')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', 'tarat/core', 'swr'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.taratConnect = {}, global.React, global.core, global.swr));
})(this, (function (exports, React, core, swr) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

  const driverWeakMap = new Map();
  typeof window !== 'undefined' && (window.driverWeakMap = driverWeakMap);
  const scopeSymbol = Symbol.for('@taratReactScope');
  function useReactProgress(react, result) {
      const state = result[scopeSymbol].getState();
      return {
          state,
      };
  }
  function useReactHook(react, hook, args) {
      var _a;
      const init = React.useRef(null);
      const driver = React.useContext(DriverContext);
      if (!init.current) {
          const serializedArgs = swr.unstable_serialize(args);
          const cachedDriverResult = (_a = driverWeakMap.get(hook)) === null || _a === void 0 ? void 0 : _a.get(serializedArgs);
          // match the cache
          if (cachedDriverResult) {
              init.current = {
                  scope: cachedDriverResult.scope,
                  result: Object.assign({
                      [scopeSymbol]: cachedDriverResult.scope,
                  }, cachedDriverResult.result),
              };
          }
          else {
              const bmName = hook.__name__ || hook.name;
              let ssrContext = [];
              if (driver) {
                  ssrContext = driver.getContext(bmName) || [];
              }
              else {
                  throw new Error('[useTarat] must provide a DriverContext at Root ');
              }
              const runner = new core.Runner(hook, {
                  beleiveContext: driver.beleiveContext,
                  updateCallbackSync: driver.updateCallbackSync,
              });
              const initialContext = ssrContext.pop();
              const scope = runner.prepareScope(args, initialContext);
              driver === null || driver === void 0 ? void 0 : driver.push(scope, bmName);
              const r = runner.executeDriver(scope);
              init.current = {
                  scope,
                  result: Object.assign({
                      [scopeSymbol]: scope,
                  }, r)
              };
              let m = driverWeakMap.get(hook);
              if (!m) {
                  m = new Map;
                  driverWeakMap.set(hook, m);
              }
              m.set(serializedArgs, {
                  scope,
                  result: r,
              });
          }
      }
      // release event
      React.useEffect(() => {
          function fn() {
              setHookResult(Object.assign({}, init.current.result));
          }
          init.current.scope.activate(fn);
          return () => {
              init.current.scope.deactivate(fn);
          };
      }, []);
      const [hookResult, setHookResult] = React.useState(init.current.result);
      return hookResult;
  }

  let hookAdaptorRuntime = null;
  let hookAdaptorType = null;
  function setHookAdaptor(runtime, type) {
      hookAdaptorRuntime = runtime;
      hookAdaptorType = type;
      return () => {
          hookAdaptorRuntime = null;
          hookAdaptorType = null;
      };
  }
  function useTarat(driver, ...args) {
      switch (hookAdaptorType) {
          case 'react':
              return useReactHook(hookAdaptorRuntime, driver, args);
          // case 'axii':
          //   return useAxiiHook(hookAdaptorRuntime, driver, args)
          default:
              throw new Error('[useTarat] must specific a UI framework like react');
      }
  }
  function useProgress(driverResult) {
      switch (hookAdaptorType) {
          case 'react':
              return useReactProgress(hookAdaptorRuntime, driverResult);
      }
  }
  // aliass
  const useDriver = useTarat;

  const DriverContext = React.createContext(null);
  function renderWithDriverContext(e, d) {
      globalThis.dc = DriverContext;
      return {
          cancelAdaptor: setHookAdaptor(React__default["default"], 'react'),
          root: React.createElement(DriverContext.Provider, { value: d }, e)
      };
  }
  class RenderDriver {
      constructor() {
          this.beleiveContext = false;
          this.updateCallbackSync = false;
          this.BMValuesMap = new Map();
          this.consumeCache = new Map();
      }
      fromContextMap(contextMap) {
          Object.keys(contextMap).forEach(bmName => {
              this.consumeCache.set(bmName, contextMap[bmName]);
          });
      }
      switchToServerConsumeMode() {
          this.mode = 'consume';
          this.beleiveContext = true;
          this.updateCallbackSync = false;
      }
      switchToClientConsumeMode() {
          this.mode = 'consume';
          this.beleiveContext = false;
          this.updateCallbackSync = true;
      }
      pop(name) {
          var _a;
          return (_a = this.BMValuesMap.get(name)) === null || _a === void 0 ? void 0 : _a.pop();
      }
      getContext(name) {
          var _a;
          if (this.mode !== 'consume') {
              return;
          }
          let r = this.consumeCache.get(name);
          if (!r) {
              r = (_a = this.BMValuesMap.get(name)) === null || _a === void 0 ? void 0 : _a.map(s => s.createInputComputeContext());
              this.consumeCache.set(name, r);
          }
          return r;
      }
      onPush(f) {
          this.pushListener = f;
      }
      push(scope, name) {
          var _a;
          if (this.mode !== 'collect') {
              return;
          }
          let values = this.BMValuesMap.get(name);
          if (!values) {
              values = [];
              this.BMValuesMap.set(name, values);
          }
          (_a = this.pushListener) === null || _a === void 0 ? void 0 : _a.call(this, scope);
          return values.push(scope);
      }
  }

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

  function traverse(target, callback, parentKeys) {
      if (!parentKeys) {
          parentKeys = [];
      }
      Object.entries(target).forEach(([key, value]) => {
          const currentKeys = parentKeys.concat(key);
          callback(currentKeys, value);
          if (typeof value === 'object' && value) {
              traverse(value, callback, currentKeys);
          }
      });
  }
  const undefTag = '__tarat_undefined_placehodler_tag__';
  function stringifyWithUndef(data) {
      return JSON.stringify(data, (k, v) => {
          return v === undefined ? undefTag : v;
      });
  }
  function parseWithUndef(str) {
      return JSON.parse(str, (k, v) => {
          if (v === undefTag) {
              return undefined;
          }
          return v;
      });
  }
  const BINARY_FILE_TYPE_PLACEHOLDER = '@binary:FILE';
  const BINARY_FILE_KEY_SPLIT_CHAR = '.';
  function isBinaryType(v) {
      return v instanceof File;
  }
  /**
   * @TODO support more data type: Blob, ArrayBuffer
   */
  function serializeJSON(obj) {
      let hasBinary = false;
      traverse(obj, (kArr, value) => {
          hasBinary = hasBinary || isBinaryType(value);
      });
      console.log('hasBinary: ', hasBinary);
      // transform it to FormData
      if (hasBinary) {
          const fileKeysMap = [];
          traverse(obj, (kArr, value) => {
              if (isBinaryType(value)) {
                  fileKeysMap.push([kArr, value]);
              }
          });
          fileKeysMap.forEach(([kArr, value]) => {
              core.set(obj, kArr, BINARY_FILE_TYPE_PLACEHOLDER);
              const binaryTempKey = kArr.join(BINARY_FILE_KEY_SPLIT_CHAR);
              obj[binaryTempKey] = value;
          });
          const fd = new FormData();
          Object.entries(obj).forEach(([k, v]) => {
              if (isBinaryType(v)) {
                  fd.append(k, v);
              }
              else {
                  fd.append(k, stringifyWithUndef(v));
              }
          });
          return fd;
      }
      return stringifyWithUndef(obj);
  }

  function clientRuntime(c) {
      var _a, _b;
      const { framework = {}, name = 'react', modelConfig = {}, host = '/' } = c;
      setHookAdaptor(framework, name);
      const me = new core.ModelEvent();
      core.setGlobalModelEvent(me);
      const hostConfig = `${host}${((_a = window.taratConfig) === null || _a === void 0 ? void 0 : _a.apiPre) || '_hook'}`;
      const diffPath = `${host}${((_b = window.taratConfig) === null || _b === void 0 ? void 0 : _b.diffPath) || '_diff'}`;
      /**
       * @TODO should provide by @tarat-run by default
       */
      core.loadPlugin('Model', Object.assign({ find(e, w) {
              return __awaiter(this, void 0, void 0, function* () {
                  return [];
              });
          },
          update(e, w) {
              return __awaiter(this, void 0, void 0, function* () {
                  return [];
              });
          },
          remove(e, d) {
              return __awaiter(this, void 0, void 0, function* () {
                  return [];
              });
          },
          create(e, d) {
              return __awaiter(this, void 0, void 0, function* () {
                  return {};
              });
          },
          executeDiff(d) {
              return __awaiter(this, void 0, void 0, function* () { });
          } }, modelConfig));
      core.loadPlugin('Context', Object.assign({ postDiffToServer(entity, diff) {
              return __awaiter(this, void 0, void 0, function* () {
                  yield fetch(`${diffPath}`, {
                      method: 'POST',
                      body: stringifyWithUndef({
                          entity,
                          diff
                      })
                  });
              });
          },
          postComputeToServer(c) {
              return __awaiter(this, void 0, void 0, function* () {
                  const newContext = yield fetch(`${hostConfig}/${c.name}`, {
                      method: 'POST',
                      body: serializeJSON(c)
                  })
                      .then(r => r.text())
                      .then(parseWithUndef);
                  return newContext;
              });
          },
          postQueryToServer(c) {
              return __awaiter(this, void 0, void 0, function* () {
                  const newContext = yield fetch(`${hostConfig}/${c.name}`, {
                      method: 'POST',
                      body: serializeJSON(c)
                  })
                      .then(r => r.text())
                      .then(parseWithUndef);
                  return newContext;
              });
          } }, modelConfig));
      core.loadPlugin('Cache', {
          getValue(k, f) {
              return __awaiter(this, void 0, void 0, function* () {
                  return undefined;
              });
          },
          setValue(k, v, f) {
              return __awaiter(this, void 0, void 0, function* () { });
          },
          clearValue(k, f) { }
      });
  }

  exports.BINARY_FILE_KEY_SPLIT_CHAR = BINARY_FILE_KEY_SPLIT_CHAR;
  exports.BINARY_FILE_TYPE_PLACEHOLDER = BINARY_FILE_TYPE_PLACEHOLDER;
  exports.DriverContext = DriverContext;
  exports.RenderDriver = RenderDriver;
  exports.clientRuntime = clientRuntime;
  exports.isBinaryType = isBinaryType;
  exports.parseWithUndef = parseWithUndef;
  exports.renderWithDriverContext = renderWithDriverContext;
  exports.serializeJSON = serializeJSON;
  exports.setHookAdaptor = setHookAdaptor;
  exports.stringifyWithUndef = stringifyWithUndef;
  exports.traverse = traverse;
  exports.useDriver = useDriver;
  exports.useProgress = useProgress;
  exports.useTarat = useTarat;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
