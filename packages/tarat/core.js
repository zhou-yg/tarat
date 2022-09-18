(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('immer'), require('eventemitter3')) :
    typeof define === 'function' && define.amd ? define(['exports', 'immer', 'eventemitter3'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.taratCore = {}, global.immer, global.EventEmitter));
})(this, (function (exports, immer, EventEmitter) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var EventEmitter__default = /*#__PURE__*/_interopDefaultLegacy(EventEmitter);

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

    /**
     * cloned from https://github.com/tj/co/blob/master/index.js
     */
    /**
     * slice() reference.
     */
    var slice = Array.prototype.slice;
    function co(gen, evt) {
        var ctx = this;
        // we wrap everything in a promise to avoid promise chaining,
        // which leads to memory leak errors.
        // see https://github.com/tj/co/issues/180
        return new Promise(function (resolve, reject) {
            onFulfilled();
            /**
             * @param {Mixed} res
             * @return {Promise}
             * @api private
             */
            function onFulfilled(res) {
                evt.onResume(res);
                var ret;
                try {
                    ret = gen.next(res);
                }
                catch (e) {
                    return reject(e);
                }
                evt.onSuspend();
                next(ret);
                return null;
            }
            /**
             * @param {Error} err
             * @return {Promise}
             * @api private
             */
            function onRejected(err) {
                var ret;
                try {
                    ret = gen.throw(err);
                }
                catch (e) {
                    return reject(e);
                }
                next(ret);
            }
            /**
             * Get the next value in the generator,
             * return a promise.
             *
             * @param {Object} ret
             * @return {Promise}
             * @api private
             */
            function next(ret) {
                if (ret.done)
                    return resolve(ret.value);
                var value = toPromise.call(ctx, ret.value);
                if (value && isPromise$1(value))
                    return value.then(res => {
                        onFulfilled(res);
                    }, onRejected);
                return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, ' +
                    'but the following object was passed: "' +
                    String(ret.value) +
                    '"'));
            }
        });
    }
    /**
     * Convert a `yield`ed value into a promise.
     *
     * @param {Mixed} obj
     * @return {Promise}
     * @api private
     */
    function toPromise(obj) {
        if (!obj)
            return obj;
        if (isPromise$1(obj))
            return obj;
        if (isGeneratorFunction(obj) || isGenerator$1(obj))
            return co.call(this, obj);
        if ('function' == typeof obj)
            return thunkToPromise.call(this, obj);
        if (Array.isArray(obj))
            return arrayToPromise.call(this, obj);
        if (isObject(obj))
            return objectToPromise.call(this, obj);
        return obj;
    }
    /**
     * Convert a thunk to a promise.
     *
     * @param {Function}
     * @return {Promise}
     * @api private
     */
    function thunkToPromise(fn) {
        var ctx = this;
        return new Promise(function (resolve, reject) {
            fn.call(ctx, function (err, res) {
                if (err)
                    return reject(err);
                if (arguments.length > 2)
                    res = slice.call(arguments, 1);
                resolve(res);
            });
        });
    }
    /**
     * Convert an array of "yieldables" to a promise.
     * Uses `Promise.all()` internally.
     *
     * @param {Array} obj
     * @return {Promise}
     * @api private
     */
    function arrayToPromise(obj) {
        return Promise.all(obj.map(toPromise, this));
    }
    /**
     * Convert an object of "yieldables" to a promise.
     * Uses `Promise.all()` internally.
     *
     * @param {Object} obj
     * @return {Promise}
     * @api private
     */
    function objectToPromise(obj) {
        var results = new obj.constructor();
        var keys = Object.keys(obj);
        var promises = [];
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var promise = toPromise.call(this, obj[key]);
            if (promise && isPromise$1(promise))
                defer(promise, key);
            else
                results[key] = obj[key];
        }
        return Promise.all(promises).then(function () {
            return results;
        });
        function defer(promise, key) {
            // predefine the key in the result
            results[key] = undefined;
            promises.push(promise.then(function (res) {
                results[key] = res;
            }));
        }
    }
    /**
     * Check if `obj` is a promise.
     *
     * @param {Object} obj
     * @return {Boolean}
     * @api private
     */
    function isPromise$1(obj) {
        return 'function' == typeof obj.then;
    }
    /**
     * Check if `obj` is a generator.
     *
     * @param {Mixed} obj
     * @return {Boolean}
     * @api private
     */
    function isGenerator$1(obj) {
        return 'function' == typeof obj.next && 'function' == typeof obj.throw;
    }
    /**
     * Check if `obj` is a generator function.
     *
     * @param {Mixed} obj
     * @return {Boolean}
     * @api private
     */
    function isGeneratorFunction(obj) {
        var constructor = obj.constructor;
        if (!constructor)
            return false;
        if ('GeneratorFunction' === constructor.name ||
            'GeneratorFunction' === constructor.displayName)
            return true;
        return isGenerator$1(constructor.prototype);
    }
    /**
     * Check for plain object.
     *
     * @param {Mixed} val
     * @return {Boolean}
     * @api private
     */
    function isObject(val) {
        return Object == val.constructor;
    }

    const isArray = Array.isArray;
    const ownKeys = Reflect.ownKeys;
    const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
    function shallowCopy(base) {
        if (isArray(base))
            return Array.prototype.slice.call(base);
        const descriptors = getOwnPropertyDescriptors(base);
        let keys = ownKeys(descriptors);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const desc = descriptors[key];
            if (desc.writable === false) {
                desc.writable = true;
                desc.configurable = true;
            }
            // like object.assign, we will read any _own_, get/set accessors. This helps in dealing
            // with libraries that trap values, like mobx or vue
            // unlike object.assign, non-enumerables will be copied as well
            if (desc.get || desc.set)
                descriptors[key] = {
                    configurable: true,
                    writable: true,
                    enumerable: desc.enumerable,
                    value: base[key]
                };
        }
        return Object.create(Object.getPrototypeOf(base), descriptors);
    }
    /* HELPERS */
    const getKeys = Object.keys;
    const isEqual = (x, y) => {
        if (x === y)
            return true;
        if (typeof x === 'object' &&
            typeof y === 'object' &&
            x !== null &&
            y !== null) {
            if (isArray(x)) {
                if (isArray(y)) {
                    let xLength = x.length;
                    let yLength = y.length;
                    if (xLength !== yLength)
                        return false;
                    while (xLength--) {
                        if (!isEqual(x[xLength], y[xLength]))
                            return false;
                    }
                    return true;
                }
                return false;
            }
            else if (isArray(y)) {
                return false;
            }
            else {
                let xKeys = getKeys(x);
                let xLength = xKeys.length;
                let yKeys = getKeys(y);
                let yLength = yKeys.length;
                if (xLength !== yLength)
                    return false;
                while (xLength--) {
                    const key = xKeys[xLength];
                    const xValue = x[key];
                    const yValue = y[key];
                    if (!isEqual(xValue, yValue))
                        return false;
                    if (yValue === undefined && !Reflect.has(y, key))
                        return false;
                }
            }
            return true;
        }
        return x !== x && y !== y;
    };
    function last(arr) {
        return arr[arr.length - 1];
    }
    function cloneDeep(obj) {
        return obj && JSON.parse(JSON.stringify(obj));
    }
    function applyPatchesToObject(target, patches) {
        patches.forEach((p) => {
            switch (p.op) {
                case 'add':
                    set(target, p.path, p.value);
                    break;
                case 'remove':
                    deleteKey(target, p);
                    break;
                case 'replace':
                    set(target, p.path, p.value);
                    break;
            }
        });
    }
    function isPrimtive(v) {
        if (v === null) {
            return true;
        }
        const type = typeof v;
        return [
            'undefined',
            'number',
            'symbol',
            'string',
            'bigint',
            'boolean'
        ].includes(type);
    }
    function deleteKey(obj, p) {
        const { path, value } = p;
        let tail = path.length > 0 ? get(obj, path.slice(0, -1)) : obj;
        const key = last(path);
        if (tail instanceof Set) {
            tail.delete(value);
        }
        if (tail instanceof Map) {
            tail.delete(key);
        }
        else {
            delete tail[key];
        }
    }
    function set(obj, path, value) {
        let base = obj;
        const currentFieldPath = isArray(path)
            ? path.slice(0)
            : path.split
                ? path.split('.')
                : [path];
        if (currentFieldPath.length > 0) {
            const fieldName = currentFieldPath.pop();
            currentFieldPath.forEach((p, i) => {
                if (base[p] === undefined)
                    base[p] = {};
                base = base[p];
            });
            if (base instanceof Map) {
                base.set(fieldName, value);
            }
            else if (base instanceof Set) {
                base.add(value);
            }
            else {
                base[fieldName] = value;
            }
        }
    }
    function get(obj, path) {
        let base = obj;
        const pathArr = isArray(path)
            ? path.slice(0)
            : path.split
                ? path.split('.')
                : [path];
        if (pathArr.length === 0) {
            return obj;
        }
        const currentPathArr = pathArr.slice(0, -1);
        const key = last(pathArr);
        for (const p of currentPathArr) {
            if (base[p] === undefined)
                return undefined;
            base = base[p];
        }
        if (base instanceof Map) {
            return base.get(key);
        }
        return base[key];
    }
    function map(target, callback) {
        if (!target || typeof target !== 'object') {
            throw new Error('can not map');
        }
        if (isArray(target)) {
            return target.map(callback);
        }
        return Object.values(target).map(callback);
    }
    function likeObject(target) {
        return target && typeof target === 'object';
    }
    function isDef(v) {
        return typeof v !== 'undefined';
    }
    function isUndef(v) {
        return typeof v === 'undefined';
    }
    function isFunc(f) {
        return typeof f === 'function';
    }
    function isAsyncFunc(f) {
        return f && f[Symbol.toStringTag] === 'AsyncFunction';
    }
    function isPromise(p) {
        return p && (p instanceof Promise || !!p.then);
    }
    function isGenerator(g) {
        return g && 'function' == typeof g.next && 'function' == typeof g.throw;
    }
    function nextTick(fn) {
        // const p = Promise.resolve()
        // let run = true
        // p.then(() => {
        //   if (run) {
        //     fn()
        //   }
        // })
        let st = setTimeout(fn, 0);
        return () => clearTimeout(st);
    }
    function findWithDefault(arr, fn, defaults) {
        let e = arr.find(fn);
        if (!e && defaults) {
            e = defaults;
            arr.push(e);
        }
        return e;
    }
    const isDataPatch = (p) => Reflect.has(p, 'path');
    const isModelPatch = (p) => !Reflect.has(p, 'path');
    /**
     * 预处理patch，推导数组通过splice，找到被删除的元素。修正的patches语义已经跟immer冲突了，不能再二次使用
     * arr.splice(0, 1) -> 0 后面的全部前移，最后length = length -1 完成
     * 删除尾部，直接减少length
     * 删除非尾部, 尾部往前占位，再减少length
     *
     * 考虑新增：如果在删除的过程中又有新增，则新增会去占位已经删除的数据位置，如果通过equal来检查，有可能新增的值跟之前是一样的，如何确认这个数据是新增的还是旧的？
     *  站在DB的场景里思考：如果是含有id的一样，那对于DB来说就不是新增
     *    但可能的异常是：在乐观更新的机制下，新增了无id对象，在更新数据库的异步期间，又新增了，但是因为跟之前的本地内存里的，无id对象一样，误判成了是移动，最后导致异步期间的新增都无效了
     *      解决方法：乐观更新的model，在生产patch需要维护一个本地序列来生产
     */
    function preparePatches2(data, ps) {
        const lengthPatchIndexes = [];
        ps.forEach((p, i) => {
            const source = p.path.length === 1 ? data : get(data, p.path.slice(0, -1));
            if (isArray(source) && last(p.path) === 'length') {
                lengthPatchIndexes.push([i, source, p.path.slice(0, -1)]);
            }
        });
        if (lengthPatchIndexes.length > 0) {
            const allInsertPatches = [];
            lengthPatchIndexes.forEach(([index, source, currentPath]) => {
                const newArrLength = ps[index].value;
                const sourcePatches = [];
                let startMovingIndex = index - 1;
                for (index - 1; startMovingIndex >= 0; startMovingIndex--) {
                    const p = ps[startMovingIndex];
                    const currentSource = p.path.length === 1 ? data : get(data, p.path.slice(0, -1));
                    if (currentSource === source) {
                        sourcePatches.unshift(Object.assign(Object.assign({}, p), { path: p.path.slice(-1) }));
                    }
                    else {
                        break;
                    }
                }
                const newSource = immer.applyPatches(source, sourcePatches);
                const reservedPatches = [];
                const newInsertPatches = [];
                sourcePatches.forEach(p => {
                    // value: maybe add, reserve
                    // path: maybe remove, reserve (including length)
                    const { path, value } = p;
                    const existInOldIndex = source.findIndex((v) => isEqual(v, value));
                    const existInNewIndex = newSource.findIndex((v) => isEqual(v, value));
                    const alreadyReversed1 = reservedPatches.find(p => isEqual(p.value, value));
                    // add
                    if (existInOldIndex === -1 && existInNewIndex > -1) {
                        newInsertPatches.push({
                            op: 'add',
                            value,
                            path: currentPath.concat(path)
                        });
                    }
                    else if (existInOldIndex > -1 && existInNewIndex > -1) {
                        if (!alreadyReversed1) {
                            reservedPatches.push({
                                op: 'replace',
                                value,
                                path: currentPath.concat(path)
                            });
                        }
                    }
                    const oldPathValue = get(source, path);
                    const oldExistInNewIndex = newSource.findIndex((v) => isEqual(v, oldPathValue));
                    const alreadyReversed2 = reservedPatches.find(p => isEqual(p.value, oldPathValue));
                    if (oldExistInNewIndex > -1) {
                        if (!alreadyReversed2) {
                            reservedPatches.push({
                                op: 'replace',
                                value: oldPathValue,
                                path: currentPath.concat(path)
                            });
                        }
                    }
                    else {
                        newInsertPatches.push({
                            op: 'remove',
                            value: oldPathValue,
                            path: currentPath.concat(path)
                        });
                    }
                });
                // directly remove tail
                if (newArrLength < source.length) {
                    let si = newArrLength;
                    let reservedDataValuesMarks = reservedPatches.map(({ value }) => value);
                    while (si < source.length) {
                        const oldReservedLength = reservedDataValuesMarks.length;
                        // @TODO: immer的object是重新生成的，在引用上并不相等，所以需要isEqual
                        // 防止值被重复消费，因为数组的值有可能是重复的
                        reservedDataValuesMarks = reservedDataValuesMarks.filter(v => !isEqual(source[si], v));
                        if (reservedDataValuesMarks.length === oldReservedLength) {
                            // 当前值不是要保留的值，标记“删除”
                            newInsertPatches.push({
                                op: 'remove',
                                value: source[si],
                                path: currentPath.concat(si)
                            });
                        }
                        si++;
                    }
                }
                // newInsertPatches.length must gt 1
                allInsertPatches.push([
                    startMovingIndex + 1,
                    index - startMovingIndex,
                    newInsertPatches
                ]);
            });
            let offset = 0;
            allInsertPatches.forEach(([st, length, arr]) => {
                ps.splice(st - offset, length, ...arr);
                offset = offset + length - arr.length;
            });
        }
        return ps;
    }
    /**
     * 根据patch计算diff，决定要进行的数据库操作
     */
    function calculateDiff(data, ps) {
        data = cloneDeep(data);
        ps = preparePatches2(data, ps);
        let create = [];
        let update = [];
        const remove = [];
        ps.filter(p => p.path.length > 0).forEach(p => {
            if (p.path && p.path.length > 0) {
                const source = p.path.length === 1 ? data : get(data, p.path.slice(0, -1));
                // CAUTION: 是不是太暴力
                const pathSkipArr = p.path.filter((k, i) => {
                    return !isArray(get(data, p.path.slice(0, i)));
                });
                const patchValue = Reflect.has(p, 'value') ? p.value : get(data, p.path);
                /** 4种情况（针对model，没有数组 -> 数组的情况）
                 *
                 * 重点是区分: a.0.b  a.b  a.b.0   0.a.b ， 因为前面数组被过滤了，所以最终都是 a.b
                 *
                 * 取到的是current对象, root = { a:{ b:[x]} } -> root.a.b.0，对象->数组, source=array
                 *   x=object --> a.b
                 *   x=primitiv --> invalid
                 * root={a:{ b:x }} -> root.a.b 对象->对象, source=object
                 *   x=object --> a.b
                 *   x=primitive --> a
                 * root=[{ a: { b: x } }] -> root.0.a.b， 数组->对象->对象, source=object
                 *   x=object --> a.b
                 *   x=primitive --> a
                 * root=[{ a: [{ b: x }] }] -> root.a.0.b， 数组->对象, source=array
                 *   x=object -> a.b
                 *   x=primtive --> a
                 */
                const currentFieldPath = pathSkipArr
                    .slice(0, likeObject(patchValue) ? Infinity : -1)
                    .join('.');
                const lastPathKey = p.path[p.path.length - 1];
                switch (p.op) {
                    case 'replace':
                        {
                            // cant handle the primitive patch in array
                            if (isArray(source) && !likeObject(patchValue)) {
                                return;
                            }
                            const exist = findWithDefault(update, u => u.currentFieldPath === currentFieldPath, {
                                source,
                                value: {},
                                currentFieldPath
                            });
                            if (exist) {
                                if (isArray(source)) {
                                    exist.value = patchValue; // should bring "id"
                                }
                                else {
                                    Object.assign(exist.value, {
                                        [lastPathKey]: patchValue
                                    });
                                }
                            }
                        }
                        break;
                    case 'add':
                        {
                            if (isArray(source)) {
                                if (likeObject(patchValue)) {
                                    create.push({
                                        source,
                                        value: patchValue,
                                        currentFieldPath
                                    });
                                }
                            }
                            else {
                                if (likeObject(patchValue)) {
                                    create.push({
                                        source,
                                        value: patchValue,
                                        currentFieldPath
                                    });
                                }
                                else {
                                    const exist = findWithDefault(update, u => u.currentFieldPath === currentFieldPath, {
                                        source,
                                        value: {},
                                        currentFieldPath
                                    });
                                    if (exist) {
                                        Object.assign(exist.value, {
                                            [lastPathKey]: patchValue
                                        });
                                    }
                                }
                            }
                        }
                        break;
                    case 'remove':
                        {
                            if (likeObject(patchValue)) {
                                if (isArray(source)) {
                                    remove.push({
                                        source,
                                        value: patchValue,
                                        currentFieldPath
                                    });
                                }
                                else {
                                    remove.push({
                                        source,
                                        value: patchValue,
                                        currentFieldPath
                                    });
                                }
                            }
                            else {
                                const exist = findWithDefault(update, u => u.currentFieldPath === currentFieldPath, {
                                    source,
                                    value: {},
                                    currentFieldPath
                                });
                                if (exist) {
                                    Object.assign(exist.value, {
                                        [lastPathKey]: null
                                    });
                                }
                            }
                        }
                        break;
                }
            }
        });
        //combines
        remove.forEach(u => {
            create = create.filter(c => c.currentFieldPath === u.currentFieldPath);
            update = update.filter(c => c.currentFieldPath === u.currentFieldPath);
        });
        return {
            create,
            update,
            remove
        };
    }
    /**
     * 修改了对象或数组的patch，计算
     * 如果修改了数组的子元素，就上升到整个数组，因为数组的变化通过patch来反推太不准确了
     * patch本身已经是按计算并合并过的，这里不需要考虑合并问题
     * a.0.b.0.c --> a 变化
     * a.b.c --> a.b.c 变化，需要通知到a.b吗？因为如果不是进一步的依赖，那说明b就是primitive的
     */
    function calculateChangedPath(source, ps) {
        if (isArray(source)) {
            return [['']]; // root
        }
        const result = [];
        ps.forEach(p => {
            const i = p.path.findIndex((v, i) => {
                return (typeof v === 'number' && isArray(get(source, p.path.slice(0, i + 1))));
            });
            if (i > -1) {
                result.push(p.path.slice(0, i));
            }
            else {
                result.push(p.path.slice());
            }
        });
        return result;
    }
    // execute in server side
    // export function getDiffExecution() {
    //   return getModelConfig().executeDiff
    // }
    // // execute in client side
    // export function getPostDiffToServer() {
    //   return getModelConfig().postDiffToServer
    // }
    let currentEnv = null;
    function setEnv(env) {
        currentEnv = env;
    }
    function getEnv() {
        return {
            client: currentEnv === 'client',
            server: currentEnv === 'server'
        };
    }
    exports.enableLog = false;
    function log(pre, ...rest) {
        if (exports.enableLog) {
            console.log(`[${"server" }] [${pre}]`, ...rest);
        }
    }
    function debuggerLog(open) {
        exports.enableLog = open;
    }
    function checkQueryWhere(where) {
        return where
            ? !Object.values(where).some(v => {
                if (typeof v === 'object') {
                    return !checkQueryWhere(v);
                }
                return v === undefined;
            })
            : true;
    }
    function getDeps(f) {
        return f.__deps__;
    }
    function getName(f) {
        return f.__name__ || f.name;
    }
    function getNames(f) {
        return f.__names__;
    }
    function runGenerator(gen, onResume, onSuspend) {
        return co(gen, {
            onResume: onResume,
            onSuspend: onSuspend
        });
    }
    function makeBatchCallback(fn) {
        let cancelNotify = () => { };
        return (...args) => {
            cancelNotify();
            cancelNotify = nextTick(() => {
                fn(...args);
            });
        };
    }
    function shortValue(v) {
        if (v === undefined) {
            return '@undef';
        }
        if (typeof v === 'symbol') {
            return '@init';
        }
    }
    class DataGraphNode {
        constructor(id, type) {
            this.id = id;
            this.type = type;
            // relation types
            this.toGet = new Set();
            this.toSet = new Set();
            this.toCall = new Set();
        }
        addToGet(n) {
            this.toGet.add(n);
        }
        addToSet(n) {
            this.toSet.add(n);
        }
        addToCall(n) {
            this.toCall.add(n);
        }
        get children() {
            return new Set([
                ...this.toGet,
                ...this.toSet,
                ...this.toCall
            ]);
        }
        getAllChildren(all = new Set()) {
            this.children.forEach(c => {
                if (!all.has(c)) {
                    all.add(c);
                    c.getAllChildren(all);
                }
            });
            return all;
        }
    }
    function dataGrachTraverse(source, callback) {
        function task(current, ancestors = []) {
            const r = callback(current, ancestors);
            if (r === false) {
                return false;
            }
            for (const v1 of current.children) {
                // prevent traverse circle
                if (ancestors.includes(v1)) {
                    continue;
                }
                const r = task(v1, ancestors.concat(current));
                if (r === false) {
                    return false;
                }
            }
        }
        for (const s of [].concat(source)) {
            const r = task(s);
            if (r === false) {
                break;
            }
        }
    }
    function findReactiveDenpendencies(ancestors) {
        if (ancestors.length >= 2) {
            let r = new Set();
            for (let index = ancestors.length - 1; index > 0; index--) {
                const last = ancestors[index];
                const prevLast = ancestors[index - 1];
                if (prevLast.toGet.has(last)) {
                    r.add(prevLast);
                }
                else {
                    break;
                }
            }
            return r;
        }
    }
    function getDependencies(rootNodes, id) {
        const dependencies = new Set();
        dataGrachTraverse([...rootNodes], (n, a) => {
            if (n.id === id) {
                const deps = findReactiveDenpendencies(a.concat(n));
                deps === null || deps === void 0 ? void 0 : deps.forEach(dn => {
                    dependencies.add(dn);
                });
            }
        });
        return dependencies;
    }
    function getTypeFromContextDeps(contextDeps, index) {
        const r = contextDeps.find(v => v[1] === index);
        return (r === null || r === void 0 ? void 0 : r[0]) || 'h';
    }
    function mapGraph(s) {
        const m = new Map();
        s.forEach(n => {
            m.set(n.id, n);
        });
        return m;
    }
    function mapGraphSetToIds(s) {
        return new Set([...s].map(n => n.id));
    }
    function getNextNodes(current) {
        return current.getAllChildren();
    }
    function getPrevNodes(rootNodes, current) {
        const prevNodes = new Set();
        dataGrachTraverse([...rootNodes], (n, ancestor) => {
            if (n.id === current.id) {
                ancestor.forEach(an => {
                    prevNodes.add(an);
                });
            }
        });
        return prevNodes;
    }
    function getPrevNodesWithFilter(rootNodes, current, filter) {
        const prevNodes = new Set();
        dataGrachTraverse([...rootNodes], (n, ancestor) => {
            if (n.id === current.id) {
                const onlyGetChain = filter(ancestor.concat(n));
                onlyGetChain.forEach(gn => {
                    if (gn.id !== current.id) {
                        prevNodes.add(gn);
                    }
                });
            }
        });
        return prevNodes;
    }
    function getDependentPrevNodes(rootNodes, current) {
        return getPrevNodesWithFilter(rootNodes, current, arr => {
            const len = arr.length;
            let i = len - 1;
            while (i >= 0) {
                const last = arr[i];
                const penultimate = arr[i - 1];
                if (!penultimate || !penultimate.toGet.has(last)) {
                    break;
                }
                i--;
            }
            return arr.slice(i);
        });
    }
    function getDependentPrevNodesWithBlock(rootNodes, current, blocks = new Set()) {
        return getPrevNodesWithFilter(rootNodes, current, arr => arr.some(v => blocks.has(v)) ? [] : arr);
    }
    function getShallowDependentPrevNodes(rootNodes, current) {
        return getPrevNodesWithFilter(rootNodes, current, arr => arr.length >= 2 ? [arr[arr.length - 2]] : []);
    }
    function getInfluencedNextNodesWithDependence(rootNodes, current, getDependent) {
        const nextNodes = new Set();
        dataGrachTraverse([...rootNodes], (n, ancestor) => {
            if (n.id === current.id) {
                const allChildren = n.getAllChildren();
                allChildren.forEach(cn => {
                    nextNodes.add(cn);
                    const currentDependentNodes = getDependent(cn, n);
                    currentDependentNodes.forEach(ccn => {
                        nextNodes.add(ccn);
                    });
                });
                return false;
            }
        });
        return nextNodes;
    }
    function getInfluencedNextNodes(rootNodes, current) {
        return getInfluencedNextNodesWithDependence(rootNodes, current, (current, trigger) => {
            return getDependentPrevNodesWithBlock(rootNodes, current, new Set([trigger]));
        });
    }
    function getShallowInfluencedNextNodes(rootNodes, current) {
        return getInfluencedNextNodesWithDependence(rootNodes, current, (current, trigger) => {
            return getShallowDependentPrevNodes(rootNodes, current);
        });
    }
    function constructDataGraph(contextDeps) {
        const nodesMap = new Map();
        const hasParentIds = new Set();
        contextDeps.forEach(([hookType, id, get, set]) => {
            let current = nodesMap.get(id);
            if (!current) {
                current = new DataGraphNode(id, hookType);
                nodesMap.set(id, current);
            }
            get === null || get === void 0 ? void 0 : get.forEach(idOrArr => {
                if (Array.isArray(idOrArr)) {
                    throw new Error('[getRelatedIndexes] 1 not support compose. transform it to hook index before calling');
                }
                else {
                    let parent = nodesMap.get(idOrArr);
                    if (!parent) {
                        parent = new DataGraphNode(idOrArr, getTypeFromContextDeps(contextDeps, idOrArr));
                        nodesMap.set(idOrArr, parent);
                    }
                    hasParentIds.add(current.id);
                    parent.addToGet(current);
                }
            });
            set === null || set === void 0 ? void 0 : set.forEach(idOrArr => {
                if (Array.isArray(idOrArr)) {
                    throw new Error('[getRelatedIndexes] 1 not support compose. transform it to hook index before calling');
                }
                else {
                    let child = nodesMap.get(idOrArr);
                    if (!child) {
                        child = new DataGraphNode(idOrArr, getTypeFromContextDeps(contextDeps, idOrArr));
                        nodesMap.set(idOrArr, child);
                    }
                    hasParentIds.add(child.id);
                    if (child.type === 'ic') {
                        current.addToCall(child);
                    }
                    else {
                        current.addToSet(child);
                    }
                }
            });
        });
        const rootNodes = new Set();
        for (const [id, n] of nodesMap) {
            if (!hasParentIds.has(id)) {
                rootNodes.add(n);
            }
        }
        return rootNodes;
    }
    function getRelatedIndexes(index, contextDeps) {
        const indexArr = [].concat(index);
        const deps = new Set(indexArr);
        const rootNodes = constructDataGraph(contextDeps);
        indexArr.forEach(index => {
            const nodes1 = getInfluencedNextNodes(rootNodes, { id: index });
            const nodes2 = getDependentPrevNodes(rootNodes, { id: index });
            [nodes1, nodes2].forEach(s => {
                s.forEach(n => {
                    deps.add(n.id);
                });
            });
        });
        return deps;
    }
    function getShallowRelatedIndexes(index, contextDeps) {
        const indexArr = [].concat(index);
        const deps = new Set(indexArr);
        const rootNodes = constructDataGraph(contextDeps);
        indexArr.forEach(index => {
            const nodes1 = getShallowInfluencedNextNodes(rootNodes, { id: index });
            const nodes2 = getShallowDependentPrevNodes(rootNodes, { id: index });
            [nodes1, nodes2].forEach(s => {
                s.forEach(n => {
                    deps.add(n.id);
                });
            });
        });
        return deps;
    }

    const plugins = {};
    /**
     * provide a default CachePlugin for distribution different cahce type
     */
    const defaultCachePlugin = {
        getValue(scope, k, from) {
            return __awaiter(this, void 0, void 0, function* () {
                return getPlugin(from).get(scope, k);
            });
        },
        setValue(scope, k, v, from) {
            return getPlugin(from).set(scope, k, v);
        },
        clearValue(scope, k, from) {
            getPlugin(from).clear(scope, k);
        }
    };
    loadPlugin('Cache', defaultCachePlugin);
    function getPlugin(k) {
        const plugin = plugins[k];
        if (!plugin) {
            throw new Error(`[getPlugin] name=${k} is not found`);
        }
        return plugin;
    }
    function loadPlugin(k, p) {
        plugins[k] = p;
    }

    immer.enablePatches();
    function freeze(target) {
        if (target._hook) {
            target._hook.freezed = true;
        }
    }
    function unFreeze(target) {
        if (target._hook) {
            target._hook.freezed = false;
        }
    }
    function checkFreeze(target) {
        var _a;
        return ((_a = target._hook) === null || _a === void 0 ? void 0 : _a.freezed) === true;
    }
    class Watcher {
        constructor(target) {
            this.target = target;
            this.deps = new Map();
        }
        notify(dep, path, patches, reactiveChain) {
            const paths = this.deps.get(dep);
            const matched = paths === null || paths === void 0 ? void 0 : paths.some(p => isEqual(p, path));
            if (matched) {
                this.target.notify(dep, patches, reactiveChain);
                return true;
            }
        }
        addDep(dep, path = []) {
            dep.addWatcher(this);
            if (path.length === 0) {
                path = [''];
            }
            let paths = this.deps.get(dep);
            if (paths) {
                const exist = paths.find(p => p === path || isEqual(p, path));
                if (!exist) {
                    paths.push(path);
                }
            }
            else {
                paths = [path];
                this.deps.set(dep, [path]);
            }
            return () => {
                const paths = this.deps.get(dep);
                const existIndex = paths === null || paths === void 0 ? void 0 : paths.findIndex(p => isEqual(p, path));
                if (paths && existIndex && existIndex > -1) {
                    paths === null || paths === void 0 ? void 0 : paths.splice(existIndex, 1);
                }
            };
        }
    }
    class Hook extends EventEmitter__default["default"] {
        constructor() {
            super(...arguments);
            this.watchers = new Set();
        }
        addWatcher(w) {
            this.watchers.add(w);
        }
    }
    function isState(h) {
        return h && (h._hook ? h._hook instanceof State : h instanceof State);
    }
    var EHookEvents;
    (function (EHookEvents) {
        EHookEvents["change"] = "change";
        EHookEvents["beforeCalling"] = "beforeCalling";
        EHookEvents["afterCalling"] = "afterCalling";
    })(EHookEvents || (EHookEvents = {}));
    function getValueSilently(s) {
        return s._internalValue;
    }
    class State extends Hook {
        constructor(data, scope) {
            super();
            this.scope = scope;
            this.modifiedTimstamp = Date.now();
            this.inputComputePatchesMap = new Map();
            this._internalValue = data;
        }
        trigger(path = [''], patches, reactiveChain, triggeredSet) {
            if (!path || path.length === 0) {
                path = [''];
            }
            if (!triggeredSet) {
                triggeredSet = new Set();
            }
            this.watchers.forEach(w => {
                if (triggeredSet === null || triggeredSet === void 0 ? void 0 : triggeredSet.has(w)) {
                    return;
                }
                if (w.notify(this, path, patches, reactiveChain)) {
                    triggeredSet === null || triggeredSet === void 0 ? void 0 : triggeredSet.add(w);
                }
            });
            return triggeredSet;
        }
        get value() {
            if (currentInputeCompute) {
                return this.getInputComputeDraftValue();
            }
            return internalProxy(this, this._internalValue);
        }
        update(v, patches, silent, reactiveChain) {
            const oldValue = this._internalValue;
            this._internalValue = v;
            const shouldTrigger = oldValue !== v && !isEqual(oldValue, v);
            if (shouldTrigger) {
                this.modifiedTimstamp = Date.now();
                this.emit(EHookEvents.change, this);
            }
            reactiveChain === null || reactiveChain === void 0 ? void 0 : reactiveChain.update();
            if (silent) {
                return;
            }
            // trigger only changed
            if (shouldTrigger) {
                const triggeredSet = this.trigger(undefined, undefined, reactiveChain);
                if (patches && patches.length > 0) {
                    const changedPathArr = calculateChangedPath(oldValue, patches);
                    changedPathArr
                        .filter(p => p.length !== 0)
                        .forEach(path => this.trigger(path, patches, reactiveChain, triggeredSet));
                }
            }
        }
        applyComputePatches(ic, reactiveChain) {
            var _a;
            let exist = this.inputComputePatchesMap.get(ic);
            if (exist) {
                this.inputComputePatchesMap.delete(ic);
                this.update(exist[0], (_a = exist[1]) === null || _a === void 0 ? void 0 : _a.filter(isDataPatch), false, reactiveChain);
            }
        }
        getInputComputeDraftValue() {
            let exist = this.inputComputePatchesMap.get(currentInputeCompute);
            if (exist) {
                return exist[0];
            }
            else {
                if (isPrimtive(this._internalValue)) {
                    return this._internalValue;
                }
                return shallowCopy(this._internalValue);
            }
        }
        addComputePatches(value, patches) {
            if (currentInputeCompute) {
                let exist = this.inputComputePatchesMap.get(currentInputeCompute);
                if (!exist) {
                    exist = [value, []];
                }
                exist[0] = value;
                /**
                 * @TODO：need merging patches
                 */
                exist[1] = exist[1].concat(patches);
                this.inputComputePatchesMap.set(currentInputeCompute, exist);
            }
            else {
                throw new Error('[Model.addComputePatches] must invoked under a InputCompute');
            }
        }
    }
    class AsyncState extends State {
        constructor() {
            super(...arguments);
            this.init = true;
            this.getterPromise = null;
            this.asyncCount = 0;
        }
        startAsyncGetter() {
            this.asyncCount++;
            const currentCount = this.asyncCount;
            this.init = false;
            let resolve;
            this.getterPromise = new Promise(r => (resolve = r));
            return {
                end: () => {
                    resolve();
                    this.getterPromise = null;
                },
                valid: () => {
                    return this.asyncCount <= currentCount;
                }
            };
        }
        get pending() {
            return !!this.getterPromise;
        }
    }
    const writeInitialSymbol = Symbol.for('@@writePrismaInitial');
    class Model extends AsyncState {
        constructor(entity, getter = undefined, options = {}, scope) {
            super([], scope);
            this.entity = entity;
            this.options = options;
            this.scope = scope;
            this.queryWhereComputed = null;
            this.watcher = new Watcher(this);
            if (!getter) {
                getter = () => ({});
            }
            this.queryWhereComputed = new Computed(getter, scope);
            this.watcher.addDep(this.queryWhereComputed);
            // default to immediate
            if (options.immediate || options.immediate === undefined) {
                // do query after driver ready
                scope.effect((reactiveChain) => {
                    this.queryWhereComputed.name = `${this.name}.query`;
                    const newReactiveChain = reactiveChain === null || reactiveChain === void 0 ? void 0 : reactiveChain.add(this);
                    this.query(newReactiveChain);
                });
            }
        }
        setGetter(fn) {
            this.queryWhereComputed.getter = fn;
        }
        notify(h, p, reactiveChain) {
            log(`[${this.constructor.name}.executeQuery] withChain=${!!reactiveChain}`);
            const newReactiveChain = reactiveChain === null || reactiveChain === void 0 ? void 0 : reactiveChain.addNotify(this);
            this.executeQuery(newReactiveChain);
        }
        getQueryWhere(reactiveChain) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.queryWhereComputed.getterPromise) {
                    yield this.queryWhereComputed.getterPromise;
                }
                const queryWhereValue = ReactiveChain.withChain(reactiveChain, () => {
                    return this.queryWhereComputed.value;
                });
                if (queryWhereValue) {
                    if (queryWhereValue === ComputedInitialSymbol) {
                        // queryWhereComputed hadnt run.
                        this.query();
                    }
                    else {
                        return queryWhereValue;
                    }
                }
            });
        }
        get value() {
            if (this.init) {
                this.query(currentReactiveChain);
            }
            return super.value;
        }
        ready() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.getterPromise) {
                    yield this.getterPromise;
                }
            });
        }
        query(reactiveChain) {
            log(`[${this.constructor.name}.query]`);
            if (!reactiveChain) {
                reactiveChain = currentReactiveChain;
            }
            if (this.queryWhereComputed) {
                this.queryWhereComputed.tryModify(reactiveChain);
            }
        }
        enableQuery() {
            return __awaiter(this, void 0, void 0, function* () {
                const q = yield this.getQueryWhere();
                q && checkQueryWhere(q);
                return !!q;
            });
        }
        applyComputePatches(ic, reactiveChain) {
            return __awaiter(this, void 0, void 0, function* () {
                const exist = this.inputComputePatchesMap.get(ic);
                if (exist) {
                    this.inputComputePatchesMap.delete(ic);
                    const patches = exist[1].filter(isDataPatch);
                    const newValue = immer.applyPatches(this._internalValue, patches);
                    yield this.updateWithPatches(newValue, patches, false, reactiveChain);
                }
            });
        }
    }
    class WriteModel extends AsyncState {
        constructor(sourceModelGetter, getData, scope) {
            super(writeInitialSymbol, scope);
            this.sourceModelGetter = sourceModelGetter;
            this.getData = getData;
            this.entity = '';
            if (!getData) {
                this.setGetter(() => ({}));
            }
            if (typeof sourceModelGetter !== 'string') {
                this.sourceModel = sourceModelGetter._hook;
                this.entity = sourceModelGetter._hook.entity;
            }
            else {
                this.entity = sourceModelGetter;
            }
        }
        setGetter(fn) {
            this.getData = fn;
        }
        applyComputePatches(ic, reactiveChain) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                const exist = this.inputComputePatchesMap.get(ic);
                if (exist) {
                    this.inputComputePatchesMap.delete(ic);
                    const patches = exist[1].filter(isModelPatch);
                    const { end, valid } = this.startAsyncGetter();
                    yield this.executeModelPath(patches);
                    if (!valid()) {
                        return;
                    }
                    this.scope.modelPatchEvents.pushPatch(this, patches);
                    // TIP: must refresh after patch recording to make sure the modified time of model > patch time
                    log('[WriteModel.applyComputePatches]', 'execute patches done');
                    yield ((_a = this.sourceModel) === null || _a === void 0 ? void 0 : _a.refresh());
                    log('[WriteModel.applyComputePatches]', 'sourceModel refresh done');
                    reactiveChain === null || reactiveChain === void 0 ? void 0 : reactiveChain.update();
                    end();
                }
            });
        }
    }
    /** TIP: code for example */
    class ClientModel extends Model {
    }
    /** TIP: code for example */
    class ClientWriteModel extends WriteModel {
    }
    /**
     * only used in writing data to model entity
     */
    const writePrismaInitialSymbol = Symbol.for('@@writePrismaInitial');
    class Prisma extends Model {
        constructor() {
            super(...arguments);
            this.identifier = 'prisma';
        }
        executeQuery(reactiveChain) {
            return __awaiter(this, void 0, void 0, function* () {
                const { end, valid } = this.startAsyncGetter();
                try {
                    // @TODO：要确保时序，得阻止旧的query数据更新
                    const q = yield this.getQueryWhere(reactiveChain);
                    if (!valid()) {
                        return;
                    }
                    log(`[${this.name || ''} Model.executeQuery] 1 q.entity, q.query: `, this.entity, q);
                    let result = [];
                    if (!!q) {
                        if (valid()) {
                            result = yield getPlugin('Model').find(this.identifier, this.entity, q);
                            log(`[${this.name || ''} Model.executeQuery] 2 result: `, result);
                        }
                    }
                    if (valid()) {
                        this.update(result, [], false, reactiveChain);
                    }
                }
                catch (e) {
                    log(`[${this.name || ''} Model.executeQuery] error`);
                    console.error(e);
                }
                finally {
                    log(`[${this.name || ''} Model.executeQuery] end`);
                    if (valid()) {
                        end();
                    }
                }
            });
        }
        exist(obj) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield getPlugin('Model').find(this.identifier, this.entity, { where: obj });
                return result[0];
            });
        }
        refresh() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.executeQuery(currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(this));
            });
        }
        updateWithPatches(v, patches, silent, reactiveChain) {
            return __awaiter(this, void 0, void 0, function* () {
                const oldValue = this._internalValue;
                if (!this.options.pessimisticUpdate) {
                    log('[Model.updateWithPatches] update internal v=', v);
                    this.update(v, patches, silent, reactiveChain);
                }
                const { end } = this.startAsyncGetter();
                const { entity } = this;
                try {
                    const diff = calculateDiff(oldValue, patches);
                    log('[Model.updateWithPatches] diff: ', diff);
                    yield getPlugin('Model').executeDiff(this.identifier, entity, diff);
                }
                catch (e) {
                    console.info('[updateWithPatches] postPatches fail', e);
                    // @TODO autoRollback value
                    // if (this.options.autoRollback) {
                    //   this.update(oldValue, [], true)
                    // }
                }
                finally {
                    end();
                }
                yield this.executeQuery(reactiveChain);
            });
        }
        checkAndRefresh() {
            return __awaiter(this, void 0, void 0, function* () {
                // no need in server
            });
        }
    }
    class WritePrisma extends WriteModel {
        constructor() {
            super(...arguments);
            this.identifier = 'prisma';
        }
        executeModelPath(ps) {
            return __awaiter(this, void 0, void 0, function* () {
                const { applyComputeParalle } = this.scope;
                const opMap = {
                    create: (p) => getPlugin('Model').create(this.identifier, this.entity, p.value),
                    update: (p) => getPlugin('Model').update(this.identifier, this.entity, p.value),
                    remove: (p) => getPlugin('Model').remove(this.identifier, this.entity, p.value)
                };
                let promiseArr = [];
                for (const p of ps) {
                    currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.addCall(this, p.op);
                    const r = opMap[p.op](p);
                    if (applyComputeParalle) {
                        promiseArr.push(r);
                    }
                    else {
                        yield r;
                    }
                }
                if (promiseArr.length > 0) {
                    yield Promise.all(promiseArr);
                }
            });
        }
        createRow(obj, include) {
            return __awaiter(this, void 0, void 0, function* () {
                log('[WritePrisma.createRow]');
                const defaults = this.getData();
                if (currentInputeCompute) {
                    const d = Object.assign(defaults, obj);
                    this.addComputePatches(undefined, [
                        {
                            op: 'create',
                            value: {
                                data: d,
                                include
                            }
                        }
                    ]);
                }
                else {
                    throw new Error('[WritePrisma] must invoke "createRow" in a InputCompute');
                }
            });
        }
        updateRow(where, obj) {
            return __awaiter(this, void 0, void 0, function* () {
                log('[WritePrisma.updateRow]');
                if (currentInputeCompute) {
                    const defaults = this.getData();
                    const d = Object.assign(defaults, obj);
                    this.addComputePatches(undefined, [
                        {
                            op: 'update',
                            value: {
                                where: { id: where },
                                data: d
                            }
                        }
                    ]);
                }
                else {
                    throw new Error('[WritePrisma] must invoke "updateRow" in a InputCompute');
                }
            });
        }
        removeRow(where) {
            return __awaiter(this, void 0, void 0, function* () {
                log('[WritePrisma.removeRow]');
                if (currentInputeCompute) {
                    const defaults = this.getData();
                    this.addComputePatches(undefined, [
                        {
                            op: 'remove',
                            value: {
                                where: { id: where || (defaults === null || defaults === void 0 ? void 0 : defaults.id) }
                            }
                        }
                    ]);
                }
                else {
                    throw new Error('[WritePrisma] must invoke "updateRow" in a InputCompute');
                }
            });
        }
    }
    class ClientPrisma extends Prisma {
        executeQuery() {
            return __awaiter(this, void 0, void 0, function* () {
                const { end } = this.startAsyncGetter();
                const valid = yield this.enableQuery();
                log(`[ClientModel.executeQuery] valid=${valid} ignoreClientEnable=${this.options.ignoreClientEnable}`);
                // @TODO: ignoreClientEnable will useless
                if (valid || this.options.ignoreClientEnable) {
                    const context = this.scope.createActionContext(this);
                    log('[ClientModel.executeQuery] before post');
                    const result = yield getPlugin('Context').postQueryToServer(context);
                    const index = this.scope.hooks.indexOf(this);
                    if (result.data) {
                        const d = result.data[index];
                        if (d.length >= 2) {
                            this.update(d[1]);
                        }
                    }
                }
                end();
            });
        }
        updateWithPatches() {
            return __awaiter(this, void 0, void 0, function* () {
                throw new Error('[ClientPrisma] cant update in client');
            });
        }
        checkAndRefresh() {
            return __awaiter(this, void 0, void 0, function* () {
                const { modifiedTimstamp } = this;
                const patchEvent = this.scope.modelPatchEvents.getRecord(this);
                if (patchEvent &&
                    patchEvent.some(obj => {
                        return obj.timing > modifiedTimstamp;
                    })) {
                    this.refresh();
                }
            });
        }
    }
    /**
     * writePrisma in client will record the changing
     */
    class ClientWritePrisma extends WritePrisma {
        createRow(obj) {
            return __awaiter(this, void 0, void 0, function* () {
                throw new Error('[ClientWritePrisma] cant invoke "create" directly in client');
            });
        }
        updateRow(whereId, obj) {
            return __awaiter(this, void 0, void 0, function* () {
                throw new Error('[ClientWritePrisma] cant invoke "update" directly in client');
            });
        }
        removeRow(whereId) {
            return __awaiter(this, void 0, void 0, function* () {
                throw new Error('[ClientWritePrisma] cant invoke "remove" directly in client');
            });
        }
    }
    const CacheInitialSymbol = Symbol('@@CacheInitialSymbol');
    class Cache extends AsyncState {
        constructor(key, options, scope) {
            super(CacheInitialSymbol, scope);
            this.options = options;
            this.scope = scope;
            this.watcher = new Watcher(this);
            this.getterPromise = null;
            this.getterKey = key; // `tarat_cache_${scope.hookRunnerName}__${key}`
            if (this.options.source) {
                this.source = this.options.source._hook;
                this.watcher.addDep(this.source);
                const { _internalValue } = this.source;
                const initVal = isPrimtive(_internalValue)
                    ? _internalValue
                    : shallowCopy(_internalValue);
                super.update(initVal);
            }
        }
        notify(hook, p, reactiveChain) {
            const { from } = this.options;
            const { source } = this;
            if (hook && source && hook === source) {
                log('[Cache.notify] source changed');
                // not calling update prevent notify the watcher for current cache
                this._internalValue = CacheInitialSymbol;
                /**
                 * just clear value in cache not update directly
                 * reason 1: for lazy
                 * reason 2: prevent writing conflict while coccurent writing at same time
                 */
                getPlugin('Cache').clearValue(this.scope, this.getterKey, from);
                const newReactiveChain = reactiveChain === null || reactiveChain === void 0 ? void 0 : reactiveChain.addNotify(this);
                this.executeQuery(newReactiveChain);
            }
        }
        get value() {
            /** @TODO should use symbol for initial value */
            if (this._internalValue === CacheInitialSymbol) {
                this.executeQuery(currentReactiveChain);
            }
            const v = super.value;
            return v === CacheInitialSymbol ? undefined : v;
        }
        executeQuery(reactiveChain) {
            const _super = Object.create(null, {
                update: { get: () => super.update }
            });
            return __awaiter(this, void 0, void 0, function* () {
                const { from } = this.options;
                const { source } = this;
                const { end, valid } = this.startAsyncGetter();
                try {
                    const valueInCache = yield getPlugin('Cache').getValue(this.scope, this.getterKey, from);
                    if (!valid()) {
                        return;
                    }
                    log(`[${this.name || ''} Cache.executeQuery] valueInCache=`, valueInCache);
                    if (valueInCache !== undefined) {
                        _super.update.call(this, valueInCache, [], false, reactiveChain);
                    }
                    else if (source) {
                        const valueInSource = source.value;
                        _super.update.call(this, valueInSource, [], false, reactiveChain);
                        // unconcern the result of remote updateing
                        getPlugin('Cache').setValue(this.scope, this.getterKey, valueInSource, from);
                    }
                }
                catch (e) {
                    log(`[Cache.executeQuery] error`);
                    console.error(e);
                }
                finally {
                    log(`[${this.name || ''} Cache.executeQuery]`);
                    if (valid()) {
                        end();
                    }
                }
            });
        }
        /**
         * call by outer
         * @param v new value
         * @param patches new value with patches
         * @param silent update value wont notify watcher
         * @param reactiveChain
         */
        update(v, patches, silent, reactiveChain) {
            const _super = Object.create(null, {
                update: { get: () => super.update }
            });
            return __awaiter(this, void 0, void 0, function* () {
                const { from } = this.options;
                const { source } = this;
                if (source) {
                    throw new Error('[Cache] can not update value directly while the cache has "source" in options ');
                }
                else {
                    _super.update.call(this, v, patches === null || patches === void 0 ? void 0 : patches.filter(isDataPatch), silent, reactiveChain);
                    yield getPlugin('Cache').setValue(this.scope, this.getterKey, v, from);
                    log(`[${this.name} cache.update] end k=${this.getterKey} v=${v}`);
                }
            });
        }
    }
    let currentComputedStack = [];
    /**
     * check if running inside a computed
     */
    function underComputed() {
        return currentComputedStack.length > 0;
    }
    function pushComputed(c) {
        currentComputedStack.push(c);
    }
    function popComputed() {
        currentComputedStack.pop();
    }
    function setCurrentComputed(c) {
        currentComputedStack = c;
    }
    const ComputedInitialSymbol = Symbol('@@ComputedInitialSymbol');
    class Computed extends AsyncState {
        // @TODO: maybe here need trigger async optional setting
        constructor(getter, scope) {
            super(ComputedInitialSymbol, scope);
            this.getter = getter;
            this.batchRunCancel = () => { };
            this.watcher = new Watcher(this);
        }
        get value() {
            const callChain = currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.addCall(this);
            if (this._internalValue === ComputedInitialSymbol) {
                this.tryModify(callChain);
            }
            const v = super.value;
            return v === ComputedInitialSymbol ? undefined : v;
        }
        run(innerReactiveChain) {
            pushComputed(this);
            // making sure the hook called by computed can register thier chain
            const r = ReactiveChain.withChain(innerReactiveChain, () => {
                return this.getter(this._internalValue);
            });
            popComputed();
            if (isPromise(r)) {
                const { end, valid } = this.startAsyncGetter();
                r.then((asyncResult) => {
                    if (valid()) {
                        this.update(asyncResult, [], false, innerReactiveChain);
                        end();
                    }
                });
            }
            else if (isGenerator(r)) {
                const { end, valid } = this.startAsyncGetter();
                runGenerator(r, () => pushComputed(this), () => popComputed()).then((asyncResult) => {
                    if (valid()) {
                        this.update(asyncResult, [], false, innerReactiveChain);
                        end();
                    }
                });
            }
            else {
                this.update(r, [], false, innerReactiveChain);
                /** @TODO this code need consider again.maybe need re-design */
                this.init = false;
            }
        }
        tryModify(reactiveChain) {
            this.run(reactiveChain === null || reactiveChain === void 0 ? void 0 : reactiveChain.add(this));
        }
        notify(h, p, reactiveChain) {
            /**
             * trigger synchronism
             */
            this.run(reactiveChain === null || reactiveChain === void 0 ? void 0 : reactiveChain.addNotify(this));
        }
    }
    class ClientComputed extends Computed {
        run() {
            const { end, valid } = this.startAsyncGetter();
            const context = this.scope.createActionContext(this);
            log('[ComputedInServer.run] before post');
            getPlugin('Context')
                .postComputeToServer(context)
                .then((result) => {
                if (valid()) {
                    const index = this.scope.hooks.indexOf(this);
                    if (result.data) {
                        const d = result.data[index];
                        if (d.length >= 2) {
                            this.update(d[1]);
                        }
                    }
                    end();
                }
            });
        }
    }
    /**
     * control global InputCompute while running
     */
    let currentInputeCompute = null;
    const inputComputeStack = [];
    function pushInputComputeStack(ic) {
        inputComputeStack.push(ic);
        currentInputeCompute = ic;
    }
    function popInputComputeStack() {
        currentInputeCompute = inputComputeStack[inputComputeStack.length - 2];
        return inputComputeStack.pop();
    }
    class InputCompute extends Hook {
        constructor(getter, 
        /** @TODO should not couple the "scope" */
        scope) {
            super();
            this.getter = getter;
            this.scope = scope;
        }
        inputFuncStart() { }
        commitComputePatches(reactiveChain) {
            return this.scope.applyAllComputePatches(this, reactiveChain);
        }
        inputFuncEnd(reactiveChain) {
            const r = this.commitComputePatches(reactiveChain);
            unFreeze({ _hook: this });
            this.emit(EHookEvents.afterCalling, this);
            if (r === null || r === void 0 ? void 0 : r.some(p => isPromise(p))) {
                return Promise.all(r).then(r => { });
            }
            return Promise.resolve();
        }
        run(...args) {
            return __awaiter(this, void 0, void 0, function* () {
                this.emit(EHookEvents.beforeCalling, this);
                const isFreeze = checkFreeze({ _hook: this });
                if (isFreeze) {
                    return;
                }
                // confirm：the composed inputCompute still running under the parent inputCompute
                // if (!currentInputeCompute) {
                //   currentInputeCompute = this
                // }
                // means that current IC is nested in other IC.
                if (currentInputeCompute) {
                    const r = currentInputeCompute.commitComputePatches(currentReactiveChain);
                    if (r === null || r === void 0 ? void 0 : r.some(p => isPromise(p))) {
                        yield Promise.all(r);
                    }
                }
                pushInputComputeStack(this);
                const newReactiveChain = currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.addCall(this);
                const funcResult = ReactiveChain.withChain(newReactiveChain, () => {
                    return this.getter(...args);
                });
                popInputComputeStack();
                // if (currentInputeCompute === this) {
                //   currentInputeCompute = null
                // }
                log('[InputCompute.run]', `isGen=${isGenerator(funcResult)}`, `isP=${isPromise(funcResult)}`);
                // use generator
                if (isGenerator(funcResult)) {
                    let generatorPreservedCurrentReactiveChain;
                    yield runGenerator(funcResult, 
                    // enter: start/resume
                    () => {
                        // if (!currentInputeCompute) {
                        //   currentInputeCompute = this
                        // }
                        pushInputComputeStack(this);
                        generatorPreservedCurrentReactiveChain = currentReactiveChain;
                        currentReactiveChain = newReactiveChain;
                    }, 
                    // leave: stop/suspend
                    () => {
                        // tip: inputCompute supporting nestly compose other inputCompute
                        // if (currentInputeCompute === this) {
                        //   currentInputeCompute = null
                        // }
                        popInputComputeStack();
                        currentReactiveChain = generatorPreservedCurrentReactiveChain;
                    });
                    return this.inputFuncEnd(newReactiveChain);
                }
                else if (isPromise(funcResult)) {
                    // end compute context in advance
                    yield funcResult;
                    return this.inputFuncEnd(newReactiveChain);
                }
                if (currentInputeCompute === this) {
                    currentInputeCompute = null;
                }
                return this.inputFuncEnd(newReactiveChain);
            });
        }
    }
    class AsyncInputCompute extends InputCompute {
        constructor() {
            super(...arguments);
            this.init = true;
            this.getterPromise = null;
            this.asyncCount = 0;
        }
        startAsyncGetter() {
            this.asyncCount++;
            let currentCount = this.asyncCount;
            this.init = false;
            let resolve;
            this.getterPromise = new Promise(r => (resolve = r));
            return {
                end: () => {
                    resolve();
                    this.getterPromise = null;
                },
                valid: () => {
                    return this.asyncCount <= currentCount;
                }
            };
        }
        get pending() {
            return !!this.getterPromise;
        }
    }
    class InputComputeInServer extends AsyncInputCompute {
        run(...args) {
            return __awaiter(this, void 0, void 0, function* () {
                const { end, valid } = this.startAsyncGetter();
                this.emit(EHookEvents.beforeCalling, this);
                if (!checkFreeze({ _hook: this })) {
                    /**
                     * only icInServer need confirm all related dependencies ready
                     * because IC just be manual (by User or System)
                     */
                    yield this.scope.readyReleated(this);
                    currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(this);
                    const context = this.scope.createShallowActionContext(this, args);
                    const result = yield getPlugin('Context').postComputeToServer(context);
                    if (valid()) {
                        this.scope.applyContextFromServer(result);
                    }
                }
                if (valid()) {
                    const r = this.inputFuncEnd();
                    end();
                    return r;
                }
            });
        }
    }
    /**
     *
     *
     *
     *
     * top runner & scope
     *
     *
     *
     *
     */
    // type HookChangedPath = string
    // type ContextHook = State | Hook | Model<any> | Cache<any>
    // type ContextDepMaps = Map<
    //   Hook, Map<HookChangedPath, Hook[]>
    // >
    // type InputComputeDraft = [
    //   InputCompute,
    //   HookContext['values'],
    //   Array<[number, any, IPatch[]]>
    // ]
    // export class HookContext {
    //   hooks: ContextHook[] = []
    //   values: any[] = []
    //   depMaps: ContextDepMaps = new Map()
    //   inputComputeAndDraft: Array<InputComputeDraft> = []
    //   constructor () {
    //   }
    //   applyContext (values: HookContext['values']) {
    //     this.values = cloneDeep(values)
    //   }
    //   commitDraft (ic: InputCompute) {
    //     let icDraft: InputComputeDraft | null = null
    //     this.inputComputeAndDraft = this.inputComputeAndDraft.filter(arr => {
    //       if (arr[0] === ic) {
    //         icDraft = arr
    //         return false
    //       }
    //     })
    //     if (icDraft) {
    //       const hookValueDraftArr = icDraft[2] as InputComputeDraft[2]
    //       hookValueDraftArr.forEach(([hookIndex, hookValue, patches]) => {
    //         const hook = this.hooks[hookIndex]
    //         this.setValue(hook, hookValue, patches)
    //       })
    //     }
    //   }
    //   setValue (h: ContextHook, value: any, p: IPatch[]) {
    //     const hookIndex = this.hooks.indexOf(h)
    //     if (hookIndex < 0) {
    //       return
    //     }
    //     if (h instanceof Model) {
    //       this.setModelValue(h, value, p)
    //     } else if (h instanceof Cache) {
    //     } else {
    //     }
    //   }
    //   async setModelValue (h: Model<any>, value:any, patches:IPatch[]) {
    //     const hookIndex = this.hooks.indexOf(h)
    //     const { values } = this
    //     const oldValue = values
    //     if (!h.options.pessimisticUpdate) {
    //       values[hookIndex] = value
    //     }
    //     const { entity } = await h.getQueryWhere()
    //     try {
    //       const diff = calculateDiff(oldValue, patches)
    //       log('[Model.updateWithPatches] diff: ', diff)
    //       await getPlugin('Model').executeDiff(entity, diff)
    //     } catch (e) {
    //       console.error('[updateWithPatches] postPatches fail', e)
    //     }
    //     await h.executeQuery()
    //   }
    // }
    /**
     *
     */
    let currentReactiveChain = undefined;
    function startdReactiveChain(name = 'root') {
        currentReactiveChain = new ReactiveChain();
        currentReactiveChain.isRoot = true;
        currentReactiveChain.name = name;
        return currentReactiveChain;
    }
    function stopReactiveChain() {
        currentReactiveChain = undefined;
    }
    class ReactiveChain {
        constructor(parent, hook) {
            this.parent = parent;
            this.hook = hook;
            this.isRoot = false;
            this.allLeafCount = 0;
            this.order = 0;
            this.hasNewValue = false;
            this.children = [];
            this.order = (parent === null || parent === void 0 ? void 0 : parent.plusLeaf()) || 0;
            if (hook instanceof State) {
                this.oldValue = hook._internalValue;
            }
        }
        static withChain(chain, fn) {
            const oldCurrentReactiveChain = currentReactiveChain;
            currentReactiveChain = chain;
            const r = fn();
            currentReactiveChain = oldCurrentReactiveChain;
            return r;
        }
        plusLeaf() {
            if (this.isRoot) {
                this.allLeafCount += 1;
                return this.allLeafCount;
            }
            return this.parent.plusLeaf();
        }
        stop() {
            stopReactiveChain();
        }
        update() {
            if (this.hook instanceof State) {
                this.hasNewValue = true;
                this.newValue = this.hook._internalValue;
            }
        }
        add(trigger, key) {
            const childChain = new ReactiveChain(this, trigger);
            childChain.hookKey = key;
            this.children.push(childChain);
            if (currentRunnerScope) {
                if (trigger instanceof Hook) {
                    const index = currentRunnerScope.hooks.indexOf(trigger);
                    if (index > -1) {
                        childChain.hookIndex = index;
                    }
                }
            }
            return childChain;
        }
        addCall(trigger, key) {
            const childChain = this.add(trigger, key);
            childChain.type = 'call';
            return childChain;
        }
        addNotify(trigger) {
            const childChain = this.add(trigger);
            childChain.type = 'notify';
            return childChain;
        }
        addUpdate(child) {
            const childChain = this.add(child);
            childChain.type = 'update';
            return childChain;
        }
        print() {
            const preLink = '|--> ';
            const preDec = '|-- ';
            const preHasNextSpace = '|  ';
            const preSpace = '   ';
            function dfi(current) {
                var _a, _b, _c;
                const isRunnerScope = current.hook instanceof CurrentRunnerScope;
                let currentName = ((_a = current.hook) === null || _a === void 0 ? void 0 : _a.constructor.name) || current.name || '';
                if (isRunnerScope) {
                    currentName = `\x1b[32m${currentName}\x1b[0m`;
                }
                if ((_b = current.hook) === null || _b === void 0 ? void 0 : _b.name) {
                    currentName = `${currentName}(${(_c = current.hook) === null || _c === void 0 ? void 0 : _c.name}${current.hookKey ? '.' + current.hookKey : ''})`;
                }
                else if (isDef(current.hookIndex)) {
                    currentName = `${currentName}(${current.hookIndex})`;
                }
                if (current.type) {
                    currentName = `${current.type}: ${currentName}`;
                }
                currentName = `\x1b[32m${current.order}\x1b[0m.${currentName}`;
                const currentRows = [currentName];
                if (shortValue(current.oldValue)) {
                    currentRows.push(`${preDec}cur=${shortValue(current.oldValue)}`);
                }
                else {
                    currentRows.push(`${preDec}cur=${JSON.stringify(current.oldValue)}`);
                }
                if (current.hasNewValue) {
                    if (shortValue(current.newValue)) {
                        currentRows.push(`${preDec}new=${shortValue(current.newValue)}`);
                    }
                    else {
                        currentRows.push(`${preDec}new=${JSON.stringify(current.newValue)}`);
                    }
                }
                if (current.children.length > 0) {
                    const names = current.children.map(dfi);
                    const rows = [];
                    names.forEach((arr, i) => {
                        arr.forEach((childName, j) => {
                            if (j === 0) {
                                rows.push(`${preLink}${childName}`);
                            }
                            else {
                                if (names[i + 1]) {
                                    rows.push(`${preHasNextSpace}${childName}`);
                                }
                                else {
                                    rows.push(`${preSpace}${childName}`);
                                }
                            }
                        });
                    });
                    return [...currentRows, ...rows];
                }
                return [...currentRows];
            }
            const logRows = dfi(this);
            // console the chain log
            console.log(logRows.join('\n'));
        }
    }
    exports.EScopeState = void 0;
    (function (EScopeState) {
        EScopeState["init"] = "init";
        EScopeState["idle"] = "idle";
        EScopeState["pending"] = "pending";
    })(exports.EScopeState || (exports.EScopeState = {}));
    /**
     * ScopeContext designed for serialization
     */
    class RunnerContext {
        constructor(driverName, args, initialContext) {
            this.driverName = driverName;
            this.args = args;
            this.initialData = null;
            this.initialArgList = initialContext ? initialContext.initialArgList : args;
            this.withInitialContext = !!initialContext;
            if (initialContext) {
                this.initialData = initialContext['data'];
                this.triggerHookIndex = initialContext.index;
                this.triggerHookName = initialContext.indexName;
                // args in context has higher priority
                if (initialContext.args) {
                    this.args = initialContext.args;
                }
                if (initialContext.patch) {
                    this.patch = initialContext.patch;
                }
            }
        }
        serialize(type) { }
        formatContextData(hooks, enable) {
            const hooksData = hooks.map((hook, i) => {
                if (hook && (!enable || enable(i))) {
                    // means: client -> server, doesn't need model, server must query again
                    if (hook instanceof ClientPrisma) {
                        return ['clientPrisma'];
                    }
                    if (hook instanceof WritePrisma) {
                        return ['writePrisma'];
                    }
                    // means: server -> client
                    if (hook instanceof Model) {
                        return ['model', getValueSilently(hook), hook.modifiedTimstamp];
                    }
                    if (hook instanceof Computed) {
                        return ['computed', getValueSilently(hook), hook.modifiedTimstamp];
                    }
                    if (hook instanceof Cache) {
                        return ['cache', getValueSilently(hook), hook.modifiedTimstamp];
                    }
                    if (hook instanceof InputCompute) {
                        return ['inputCompute'];
                    }
                    if (hook instanceof State) {
                        return ['state', getValueSilently(hook), hook.modifiedTimstamp];
                    }
                }
                return ['unserialized'];
            });
            return hooksData;
        }
        /**
         * need deliver context principles, sort by priority:
         * 1.model/cache(server) needn't
         * 2.state
         * 3.related set/get
         */
        serializeAction(hooks, hookIndex, args, deps) {
            const h = hooks[hookIndex];
            const hookName = (h === null || h === void 0 ? void 0 : h.name) || '';
            const noDeps = deps.size === 0;
            const hooksData = this.formatContextData(hooks, i => noDeps || deps.has(i));
            return {
                initialArgList: this.initialArgList,
                name: this.driverName,
                data: hooksData,
                index: hookIndex === -1 ? undefined : hookIndex,
                indexName: hookName,
                args: args || []
            };
        }
        serializePatch(hooks, modelPatchEvents) {
            const hooksData = this.formatContextData(hooks);
            const p = modelPatchEvents.toArray();
            return {
                initialArgList: this.initialArgList,
                name: this.driverName,
                data: hooksData,
                // index: -1,
                // indexName: '',
                // args: [],
                patch: p
            };
        }
        serializeBase(hooks) {
            const hooksData = this.formatContextData(hooks);
            return {
                initialArgList: this.initialArgList,
                name: this.driverName,
                data: hooksData,
                // index: -1,
                // indexName: '',
                // args: [],
                patch: []
            };
        }
        apply(hooks, c, needUpdateCallback) {
            const contextData = c.data;
            /** @TODO runContext shouldnt care the update logic */
            contextData.forEach(([type, value, timestamp], index) => {
                if (isDef(value)) {
                    const state = hooks[index];
                    switch (type) {
                        case 'unserialized':
                            break;
                        default:
                            /**
                             * default to keep silent because of deliver total context now
                             */
                            needUpdateCallback(state, value, timestamp);
                            break;
                    }
                }
            });
            this.patch = c.patch;
        }
    }
    class ModelEvent {
        constructor() {
            this.data = new Map();
            this.listeners = [];
        }
        subscribe(f) {
            this.listeners.push(f);
            return () => {
                const i = this.listeners.indexOf(f);
                this.listeners.splice(i, 1);
            };
        }
        from(arr) {
            this.data.clear();
            arr.forEach(([entity, record]) => {
                this.data.set(entity, record);
            });
            this.listeners.forEach(f => f());
        }
        toArray() {
            const arr = [];
            this.data.forEach((v, k) => {
                arr.push([k, v]);
            });
            return arr;
        }
        getRecord(m) {
            return this.data.get(m.entity);
        }
        pushPatch(m, p) {
            let record = this.data.get(m.entity);
            if (!record) {
                record = [];
                this.data.set(m.entity, record);
            }
            record.push({
                timing: Date.now(),
                patch: p
            });
        }
    }
    class CurrentRunnerScope {
        constructor(runnerContext, intialContextDeps, intialContextNames, modelPatchEvents) {
            this.runnerContext = runnerContext;
            this.intialContextDeps = intialContextDeps;
            this.intialContextNames = intialContextNames;
            this.modelPatchEvents = modelPatchEvents;
            this.hooks = [];
            this.composes = []; // store the compose execute resutl
            this.outerListeners = [];
            this.stateChangeCallbackRunning = false;
            this.stateChangeCallbackCancel = () => { };
            this.stateChangeWaitHooks = new Set();
            this.watcher = new Watcher(this);
            this.reactiveChainStack = [];
            /**
             * receive by runner options
             */
            this.beleiveContext = false;
            this.updateCallbackSync = false;
            this.applyComputeParalle = false;
            this.effectFuncArr = [];
            this.disposeFuncArr = [];
            this.initializeHookSet();
            this.disposeFuncArr.push(modelPatchEvents.subscribe(() => {
                this.notifyAllModel();
            }));
        }
        /**
         * copy context value into scope for updateXXX hook
         */
        initializeHookSet() {
            const { runnerContext } = this;
            if (runnerContext.triggerHookIndex !== undefined &&
                typeof runnerContext.triggerHookIndex === 'number' &&
                runnerContext.initialData.length > 0) {
                /** @TODO belive deps calculation from client.it's maybe dangerous' */
                const s = new Set([runnerContext.triggerHookIndex]);
                runnerContext.initialData.forEach((d, i) => {
                    if (d[0] !== 'unserialized') {
                        s.add(i);
                    }
                });
                this.initialHooksSet = s;
            }
        }
        setOptions(op) {
            Object.assign(this, op);
        }
        effect(f) {
            this.effectFuncArr.push(f);
        }
        flushEffects() {
            if (this.effectFuncArr.length) {
                const reactiveChain = currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(this);
                this.effectFuncArr.forEach(f => f(reactiveChain));
                this.effectFuncArr = [];
            }
        }
        /**
         * call the executable hook: Model, InputCompute
         * @TODO the executable hook maybe need a abstract base class
         */
        callHook(hookIndex, args) {
            return __awaiter(this, void 0, void 0, function* () {
                log('[Scope.callHook] start');
                const hook = this.hooks[hookIndex];
                if (hook) {
                    if (hook instanceof Model) ;
                    else if (hook instanceof Computed) {
                        currentReactiveChain = currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(this);
                        hook.run(currentReactiveChain);
                    }
                    else if (hook instanceof InputCompute) {
                        currentReactiveChain = currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(this);
                        yield hook.run(...args);
                    }
                }
                log('[Scope.callHook] end');
            });
        }
        /**
         * while enter UI will activate this function
         */
        activate(fn) {
            this.notifyAllModel();
            this.outerListeners.push(fn);
        }
        deactivate(fn) {
            this.outerListeners = fn ? this.outerListeners.filter(f => f !== fn) : [];
        }
        notifyAllModel() {
            this.hooks.forEach(h => {
                if (h instanceof Model) {
                    h.checkAndRefresh();
                }
            });
        }
        onUpdate(f) {
            this.outerListeners.push(f);
            return () => {
                this.outerListeners = this.outerListeners.filter(_ => _ !== f);
            };
        }
        notifyOuter() {
            this.outerListeners.forEach(f => f());
        }
        notify(s) {
            if (this.updateCallbackSync) {
                this.notifyOuter();
            }
            else {
                this.stateChangeCallbackCancel();
                this.stateChangeCallbackCancel = nextTick(() => {
                    this.notifyOuter();
                });
            }
        }
        addHook(v) {
            if (v && this.hooks.indexOf(v) !== -1) {
                throw new Error('[scope.addHook] cant add repeat hook');
            }
            this.hooks.push(v);
            if (v) {
                this.watcher.addDep(v);
                // assign name by inject deps
                if (this.intialContextNames) {
                    const r = this.intialContextNames.find(arr => arr[0] === this.hooks.length - 1);
                    if (r === null || r === void 0 ? void 0 : r[1]) {
                        v.name = r[1];
                    }
                }
            }
        }
        applyDepsMap() {
            const deps = this.intialContextDeps;
            deps === null || deps === void 0 ? void 0 : deps.forEach(([name, hookIndex, getDeps]) => {
                getDeps.forEach(triggerHookIndex => {
                    var _a, _b;
                    let triggerHook;
                    if (Array.isArray(triggerHookIndex)) {
                        const [type, composeIndex, variableName] = triggerHookIndex;
                        if (type === 'c') {
                            const setterGetterFunc = (_a = this.composes[composeIndex]) === null || _a === void 0 ? void 0 : _a[variableName];
                            triggerHook = this.hooks.find(h => h === (setterGetterFunc === null || setterGetterFunc === void 0 ? void 0 : setterGetterFunc._hook));
                        }
                        // @TODO: maybe unknow case
                    }
                    else {
                        triggerHook = this.hooks[triggerHookIndex];
                    }
                    if (triggerHook) {
                        if (this.hooks[hookIndex] instanceof Computed
                        // this.hooks[hookIndex] instanceof InputCompute
                        ) {
                            this.hooks[hookIndex].watcher.addDep(triggerHook);
                        }
                        if (this.hooks[hookIndex] instanceof Model) {
                            (_b = this.hooks[hookIndex].queryWhereComputed) === null || _b === void 0 ? void 0 : _b.watcher.addDep(triggerHook);
                        }
                    }
                });
            });
        }
        /**
         * offset compose names and current initial names
         */
        appendComposeNames(si, names) {
            if (!names) {
                return;
            }
            const len = names.length;
            const modifiedNames = (this.intialContextNames || []).map(a => {
                const arr = cloneDeep(a);
                if (arr[0] >= si) {
                    arr[0] += len;
                }
                return arr;
            });
            const newOffsetNames = names.map(a => {
                return [a[0] + si, a[1]];
            });
            this.intialContextNames = modifiedNames.concat(newOffsetNames);
        }
        /**
         * add compose deps to current driver.
         * plus current hook dep index
         */
        appendComposeDeps(si, ei, deps) {
            if (!deps) {
                return;
            }
            const hooksInComposeSize = ei - si;
            const modifiedDeps = (this.intialContextDeps || []).map(a => {
                const arr = cloneDeep(a);
                if (arr[1] >= si) {
                    arr[1] += hooksInComposeSize;
                }
                if (arr[2]) {
                    arr[2] = arr[2].map(v => typeof v === 'number' && v >= si ? v + hooksInComposeSize : v);
                }
                if (arr[3]) {
                    arr[3] = arr[3].map(v => typeof v === 'number' && v >= si ? v + hooksInComposeSize : v);
                }
                return arr;
            });
            const newModifiedDeps = deps.map(a => {
                const arr = cloneDeep(a);
                arr[1] += si;
                if (arr[2]) {
                    arr[2] = arr[2].map(v => typeof v === 'number' ? v + si : [v[0], v[1] + si, v[2]]);
                }
                if (arr[3]) {
                    arr[3] = arr[3].map(v => typeof v === 'number' ? v + si : [v[0], v[1] + si, v[2]]);
                }
                return arr;
            });
            this.intialContextDeps = modifiedDeps.concat(newModifiedDeps);
        }
        applyAllComputePatches(currentInputCompute, reactiveChain) {
            const { applyComputeParalle, hooks } = this;
            const hookModified = hooks.filter(h => {
                if (h && h.inputComputePatchesMap) {
                    return h.inputComputePatchesMap.get(currentInputCompute);
                }
            });
            if (hookModified.length) {
                let prevPromise = null;
                return hookModified.map(h => {
                    /** @TODO here appending new chain maybe in method of their self  */
                    const newChildChain = reactiveChain === null || reactiveChain === void 0 ? void 0 : reactiveChain.addUpdate(h);
                    if (h instanceof Model || h instanceof WriteModel) {
                        const r = h.applyComputePatches(currentInputCompute, newChildChain);
                        if (applyComputeParalle) {
                            prevPromise = prevPromise ? prevPromise.then(() => r) : r;
                        }
                        return r;
                    }
                    else {
                        return h.applyComputePatches(currentInputCompute, newChildChain);
                    }
                });
            }
        }
        // transform compose deps to number index that will be convinient for next steps
        hookNumberIndexDeps() {
            const hookIndexDeps = this.intialContextDeps.map(([name, hi, getD, setD]) => {
                const [newGetD, newSetD] = [getD, setD].map(dependencies => {
                    return dependencies === null || dependencies === void 0 ? void 0 : dependencies.map(numOrArr => {
                        var _a;
                        if (Array.isArray(numOrArr) && numOrArr[0] === 'c') {
                            const [_, composeIndex, variableName] = numOrArr;
                            const setterGetterFunc = (_a = this.composes[composeIndex]) === null || _a === void 0 ? void 0 : _a[variableName];
                            if (setterGetterFunc === null || setterGetterFunc === void 0 ? void 0 : setterGetterFunc._hook) {
                                return this.hooks.indexOf(setterGetterFunc._hook);
                            }
                        }
                        return numOrArr;
                    }).filter(v => v !== undefined);
                });
                return [name, hi, newGetD, newSetD];
            });
            return hookIndexDeps;
        }
        /**
         * get all related hook index according to passived hookIndex
         * design logic:
         * 1.getD -> getD -> getD
         * 2.setD in who's getD -> getD
         */
        getRelatedHookIndexes(hookIndex) {
            if (!this.intialContextDeps) {
                return new Set();
            }
            const hookIndexDeps = this.hookNumberIndexDeps();
            /**
             * for the special performance case:
             * query on any async and client state eg: Client Model, ClientCache, ComputedInServer
             *  that will batch notify all watchers of it and
             *  doing these all operations in single request
             */
            const isModel = this.hooks[hookIndex] instanceof AsyncState;
            if (isModel) {
                const indexArr = [];
                hookIndexDeps.forEach(([_, i, get, set]) => {
                    if (get.includes(hookIndex)) {
                        indexArr.push(i);
                    }
                });
                return getRelatedIndexes(indexArr, hookIndexDeps);
            }
            return getRelatedIndexes(hookIndex, hookIndexDeps);
        }
        getShallowRelatedHookIndexes(hookIndex) {
            if (!this.intialContextDeps) {
                return new Set();
            }
            const hookIndexDeps = this.hookNumberIndexDeps();
            const tailIndexes = getShallowRelatedIndexes(hookIndex, hookIndexDeps);
            return tailIndexes;
        }
        getDependenceByModel(indexes) {
            const result = new Set();
            const hookIndexDeps = this.hookNumberIndexDeps();
            const rootNodes = constructDataGraph(hookIndexDeps);
            const task = (currentIndexes) => {
                if (currentIndexes.size <= 0) {
                    return;
                }
                const modelIndexes = new Set();
                currentIndexes.forEach(i => {
                    if (this.hooks[i] instanceof Model) {
                        modelIndexes.add(i);
                    }
                });
                if (modelIndexes.size > 0) {
                    const nextModelIndexes = new Set();
                    modelIndexes.forEach(i => {
                        getShallowDependentPrevNodes(rootNodes, { id: i }).forEach(n => {
                            const r = result.has(n.id);
                            result.add(n.id);
                            if (this.hooks[n.id] instanceof Model && !r) {
                                nextModelIndexes.add(n.id);
                            }
                        });
                    });
                    task(nextModelIndexes);
                }
            };
            task(indexes);
            return result;
        }
        createBaseContext() {
            const { hooks } = this;
            return this.runnerContext.serializeBase(hooks);
        }
        getRelatedIndexesByHook(h, excludeSelf) {
            const { hooks } = this;
            const hookIndex = h ? hooks.indexOf(h) : -1;
            let deps = this.getRelatedHookIndexes(hookIndex);
            if (excludeSelf) {
                deps.delete(hookIndex);
            }
            return deps;
        }
        /**
         * as a resonse while receive a input context
         */
        createPatchContext() {
            const { hooks, modelPatchEvents } = this;
            return this.runnerContext.serializePatch(hooks, modelPatchEvents);
        }
        /**
         * as a input of other's Runner and trigger
         * need deliver context principles, sort by priority:
         * 1.model/cache(server) needn't
         * 2.state
         * 3.related set/get
         */
        createActionContext(h, args) {
            const { hooks } = this;
            const hookIndex = h ? hooks.indexOf(h) : -1;
            let deps = new Set();
            if (h) {
                deps = this.getRelatedHookIndexes(hookIndex);
            }
            return this.runnerContext.serializeAction(hooks, hookIndex, args || [], deps);
        }
        createShallowActionContext(h, args) {
            const { hooks } = this;
            const hookIndex = h ? hooks.indexOf(h) : -1;
            let deps = new Set();
            if (h) {
                deps = this.getShallowRelatedHookIndexes(hookIndex);
                /** model must need it's shallow dependent */
                if (deps.size > 0) {
                    const modelDeps = this.getDependenceByModel(deps);
                    modelDeps.forEach(v => {
                        deps.add(v);
                    });
                }
            }
            return this.runnerContext.serializeAction(hooks, hookIndex, args || [], deps);
        }
        // alias
        createInputComputeContext(h, args) {
            return this.createActionContext(h, args);
        }
        applyContextFromServer(c) {
            const { hooks } = this;
            this.runnerContext.apply(hooks, c, 
            // invoke while the target state is valid for updating
            (state, value, timestamp) => {
                var _a;
                (_a = state.update) === null || _a === void 0 ? void 0 : _a.call(state, value, [], true);
                if (value && timestamp) {
                    state.modifiedTimstamp = timestamp;
                }
            });
            if (c.patch) {
                this.modelPatchEvents.from(c.patch);
            }
            this.notify();
        }
        getState() {
            const asyncHooks = this.hooks.filter(h => h && Reflect.has(h, 'getterPromise'));
            let notReadyHooks = asyncHooks.filter(h => {
                return !!h.getterPromise;
            });
            return notReadyHooks.length === 0 ? exports.EScopeState.idle : exports.EScopeState.pending;
        }
        readyReleated(h) {
            const hi = this.getRelatedIndexesByHook(h, true);
            return this.ready(hi);
        }
        ready(specifies) {
            const asyncHooks = this.hooks.filter((h, i) => (specifies ? specifies.has(i) : true) &&
                ((h && Reflect.has(h, 'getterPromise')) ||
                    h instanceof AsyncInputCompute ||
                    h instanceof AsyncState));
            let readyResolve;
            let readyPromise = new Promise(resolve => (readyResolve = resolve));
            let max = asyncHooks.length * 2;
            let i = 0;
            function wait() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (i++ > max) {
                        throw new Error('[Scope.ready] unexpect loop for ready');
                    }
                    let notReadyHooks = asyncHooks
                        .filter(h => {
                        // if (h.getterPromise) {
                        //   console.log(h)
                        // }
                        return !!h.getterPromise;
                    })
                        .map(h => h.getterPromise);
                    if (notReadyHooks.length === 0) {
                        readyResolve();
                    }
                    else {
                        yield Promise.all(notReadyHooks);
                        wait();
                    }
                });
            }
            wait();
            return readyPromise;
        }
    }
    let currentRunnerScope = null;
    exports.GlobalModelEvent = null;
    function setGlobalModelEvent(me) {
        exports.GlobalModelEvent = me;
    }
    class Runner {
        constructor(driver, options) {
            this.driver = driver;
            this.options = {
                beleiveContext: false,
                updateCallbackSync: false,
                applyComputeParalle: false
            };
            Object.assign(this.options, options);
        }
        prepareScope(args, initialContext) {
            const context = new RunnerContext(getName(this.driver), args, initialContext);
            const modelPatchEvents = new ModelEvent()
                ;
            const deps = getDeps(this.driver);
            const names = getNames(this.driver);
            const scope = new CurrentRunnerScope(context, deps, names, modelPatchEvents);
            scope.setOptions({
                updateCallbackSync: this.options.updateCallbackSync,
                beleiveContext: this.options.beleiveContext,
                applyComputeParalle: this.options.applyComputeParalle
            });
            return scope;
        }
        executeDriver(scope) {
            const { withInitialContext } = scope.runnerContext;
            if (withInitialContext) {
                exports.currentHookFactory = updateHookFactory;
            }
            currentRunnerScope = scope;
            const result = executeDriver(this.driver, scope.runnerContext.args);
            currentRunnerScope = null;
            scope.applyDepsMap();
            // do execute effect.maybe from model/cache
            scope.flushEffects();
            exports.currentHookFactory = mountHookFactory;
            return result;
        }
        /**
         * @TODO need to refact because of this function should both return result and scope
         */
        init(args, initialContext) {
            const scope = this.prepareScope(args, initialContext);
            this.scope = scope;
            const result = this.executeDriver(scope);
            return result;
        }
        mount(args, initialContext) {
            return this.init(args, initialContext);
        }
        update(initialContext) {
            return this.init(undefined, initialContext);
        }
        /**
         * @TODO after init method refactor. shouldnt callHook through runner but scope
         */
        callHook(hookIndex, args) {
            var _a;
            return (_a = this.scope) === null || _a === void 0 ? void 0 : _a.callHook(hookIndex, args);
        }
        // same above
        state() {
            return this.scope.getState();
        }
        // same above
        ready() {
            var _a;
            return (_a = this.scope) === null || _a === void 0 ? void 0 : _a.ready();
        }
    }
    function executeDriver(f, args = []) {
        const driverResult = f(...args);
        return driverResult;
    }
    function internalProxy(source, _internalValue, path = []) {
        if (underComputed()) {
            last(currentComputedStack).watcher.addDep(source, path);
            if (_internalValue && likeObject(_internalValue)) {
                const copyValue = shallowCopy(_internalValue);
                return new Proxy(copyValue, {
                    get(target, p) {
                        let value = Reflect.get(target, p);
                        if (typeof value === 'function') {
                            value = value.bind(target);
                        }
                        return internalProxy(source, value, path.concat(p));
                    }
                });
            }
        }
        return _internalValue;
    }
    /**
     *
     *
     *
     *
     *
     * hook factory
     *
     *
     *
     *
     *
     *
     */
    const mountHookFactory = {
        state: mountState,
        model: mountPrisma,
        prisma: mountPrisma,
        writePrisma: mountWritePrisma,
        writeModel: writeModel,
        cache: mountCache,
        computed: mountComputed,
        computedInServer: mountComputedInServer,
        inputCompute: mountInputCompute,
        inputComputeInServer: mountInputComputeInServer
    };
    const updateHookFactory = {
        state: updateState,
        model: updatePrisma,
        writeModel: writeModel,
        prisma: updatePrisma,
        writePrisma: mountWritePrisma,
        cache: updateCache,
        computed: updateComputed,
        computedInServer: updateComputedInServer,
        inputCompute: updateInputCompute,
        inputComputeInServer: updateInputComputeInServer
    };
    const hookFactoryFeatures = {
        /**
         * all hooks name list
         */
        all: Object.keys(mountHookFactory),
        /**
         * need other hook as data source
         */
        withSource: ['cache', 'writeModel', 'writePrisma'],
        /**
         * manual calling by User or System
         */
        initiativeCompute: [
            'inputCompute',
            'inputComputeInServer',
            'writePrisma',
            'writeModel'
        ],
        /**
         * only compatibility with server
         */
        serverOnly: ['inputComputeInServer', 'computedInServer', 'model', 'prisma']
    };
    /** @TODO need refact code to auto export these hooks */
    const hookFactoryNames = hookFactoryFeatures.all;
    const hasSourceHookFactoryNames = hookFactoryFeatures.withSource;
    const initiativeComputeHookFactoryNames = hookFactoryFeatures.initiativeCompute;
    exports.currentHookFactory = mountHookFactory;
    function createStateSetterGetterFunc(s) {
        return (paramter) => {
            if (paramter) {
                if (isFunc(paramter)) {
                    const [result, patches] = immer.produceWithPatches(s.value, paramter);
                    if (currentInputeCompute) {
                        s.addComputePatches(result, patches);
                    }
                    else {
                        const reactiveChain = currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.addUpdate(s);
                        const isUnderComputed = underComputed();
                        s.update(result, patches, isUnderComputed, reactiveChain);
                    }
                    return [result, patches];
                }
                else {
                    throw new Error('[change state] pass a function');
                }
            }
            if (currentReactiveChain) {
                return ReactiveChain.withChain(currentReactiveChain.addCall(s), () => {
                    return s.value;
                });
            }
            return s.value;
        };
    }
    function createModelSetterGetterFunc(m) {
        return (paramter) => {
            if (paramter && isFunc(paramter)) {
                const [result, patches] = immer.produceWithPatches(shallowCopy(m.value), paramter);
                log('[model setter] result, patches: ', !!currentInputeCompute, JSON.stringify(patches, null, 2));
                if (currentInputeCompute) {
                    m.addComputePatches(result, patches);
                }
                else {
                    const reactiveChain = currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.addUpdate(m);
                    const isUnderComputed = underComputed();
                    m.updateWithPatches(result, patches, isUnderComputed, reactiveChain);
                }
                return [result, patches];
            }
            if (currentReactiveChain) {
                return ReactiveChain.withChain(currentReactiveChain.addCall(m), () => {
                    return m.value;
                });
            }
            return m.value;
        };
    }
    function createCacheSetterGetterFunc(c) {
        return (paramter) => {
            if (paramter) {
                if (isFunc(paramter)) {
                    const [result, patches] = immer.produceWithPatches(c.value, paramter);
                    if (currentInputeCompute) {
                        c.addComputePatches(result, patches);
                    }
                    else {
                        const reactiveChain = currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.addUpdate(c);
                        const isUnderComputed = underComputed();
                        c.update(result, patches, isUnderComputed, reactiveChain);
                    }
                    return [result, patches];
                }
                else {
                    throw new Error('[change cache] pass a function');
                }
            }
            if (currentReactiveChain) {
                return ReactiveChain.withChain(currentReactiveChain.addCall(c), () => {
                    return c.value;
                });
            }
            return c.value;
        };
    }
    function createUnaccessGetter(index) {
        const f = () => {
            throw new Error(`[update getter] cant access un initialized hook(${index})`);
        };
        const newF = Object.assign(f, {
            _hook: null
        });
        return newF;
    }
    function createUnaccessModelGetter(index, entity) {
        const f = () => {
            throw new Error(`[update getter] cant access un initialized hook(${index})`);
        };
        const newF = Object.assign(f, {
            _hook: { entity },
            exist: () => true,
            create: () => { },
            update: () => { },
            remove: () => { },
            refresh: () => { }
        });
        return newF;
    }
    function updateValidation() {
        const { hooks, initialHooksSet } = currentRunnerScope;
        const currentIndex = hooks.length;
        const valid = !initialHooksSet || initialHooksSet.has(currentIndex);
        return {
            valid,
            currentIndex
        };
    }
    function updateState(initialValue) {
        var _a, _b;
        const { valid, currentIndex } = updateValidation();
        initialValue =
            (_a = currentRunnerScope.runnerContext.initialData[currentIndex]) === null || _a === void 0 ? void 0 : _a[1];
        // undefined means this hook wont needed in this progress
        if (!valid) {
            currentRunnerScope.addHook(undefined);
            return createUnaccessGetter(currentIndex);
        }
        const timestamp = (_b = currentRunnerScope.runnerContext.initialData[currentIndex]) === null || _b === void 0 ? void 0 : _b[2];
        const hook = new State(initialValue, currentRunnerScope);
        if (timestamp) {
            hook.modifiedTimstamp = timestamp;
        }
        const setterGetter = createStateSetterGetterFunc(hook);
        currentRunnerScope.addHook(hook);
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        const newSetterGetter = Object.assign(setterGetter, {
            _hook: hook
        });
        return newSetterGetter;
    }
    function mountState(initialValue) {
        const hook = new State(initialValue, currentRunnerScope);
        const setterGetter = createStateSetterGetterFunc(hook);
        currentRunnerScope.addHook(hook);
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        const newSetterGetter = Object.assign(setterGetter, {
            _hook: hook
        });
        return newSetterGetter;
    }
    function updatePrisma(e, q, op) {
        var _a, _b;
        const { valid, currentIndex } = updateValidation();
        if (!valid) {
            currentRunnerScope.addHook(undefined);
            return createUnaccessModelGetter(currentIndex, e);
        }
        const inServer = "server" === 'server';
        const { beleiveContext } = currentRunnerScope;
        const receiveDataFromContext = beleiveContext || !inServer;
        op = Object.assign({}, op, {
            immediate: !receiveDataFromContext
        });
        const hook = new Prisma(e, q, op, currentRunnerScope)
            ;
        currentRunnerScope.addHook(hook);
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        if (receiveDataFromContext) {
            const initialValue = (_a = currentRunnerScope.runnerContext.initialData[currentIndex]) === null || _a === void 0 ? void 0 : _a[1];
            const timestamp = (_b = currentRunnerScope.runnerContext.initialData[currentIndex]) === null || _b === void 0 ? void 0 : _b[2];
            hook.init = false;
            hook._internalValue = initialValue || [];
            if (timestamp) {
                hook.modifiedTimstamp = timestamp;
            }
        }
        const setterGetter = createModelSetterGetterFunc(hook);
        const newSetterGetter = Object.assign(setterGetter, {
            _hook: hook,
            exist: hook.exist.bind(hook),
            // create: hook.createRow.bind(hook) as typeof hook.createRow,
            // update: hook.updateRow.bind(hook) as typeof hook.updateRow,
            // remove: hook.removeRow.bind(hook) as typeof hook.removeRow,
            refresh: hook.refresh.bind(hook)
        });
        return newSetterGetter;
    }
    function mountPrisma(e, q, op) {
        const hook = new Prisma(e, q, op, currentRunnerScope)
            ;
        currentRunnerScope.addHook(hook);
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        const setterGetter = createModelSetterGetterFunc(hook);
        const newSetterGetter = Object.assign(setterGetter, {
            _hook: hook,
            exist: hook.exist.bind(hook),
            refresh: hook.refresh.bind(hook)
        });
        return newSetterGetter;
    }
    // TIP: "function updateWritePrisma" same as mountWritePrisma
    function mountWritePrisma(source, q) {
        const hook = new WritePrisma(source, q, currentRunnerScope)
            ;
        currentRunnerScope.addHook(hook);
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        const getter = () => {
            throw new Error('[writePrisma] cant get data from writePrisma');
        };
        const newGetter = Object.assign(getter, {
            _hook: hook,
            create: hook.createRow.bind(hook),
            update: hook.updateRow.bind(hook),
            remove: hook.removeRow.bind(hook)
        });
        return newGetter;
    }
    function updateCache(key, options) {
        var _a, _b;
        const { valid, currentIndex } = updateValidation();
        if (!valid) {
            currentRunnerScope.addHook(undefined);
            return createUnaccessGetter(currentIndex);
        }
        /** @TODO cache maybe should has initial value */
        const hook = new Cache(key, options, currentRunnerScope);
        currentRunnerScope.addHook(hook);
        const initialValue = (_a = currentRunnerScope.runnerContext.initialData[currentIndex]) === null || _a === void 0 ? void 0 : _a[1];
        const timestamp = (_b = currentRunnerScope.runnerContext.initialData[currentIndex]) === null || _b === void 0 ? void 0 : _b[2];
        if (initialValue !== undefined) {
            hook._internalValue = initialValue;
            if (timestamp) {
                hook.modifiedTimstamp = timestamp;
            }
        }
        const setterGetter = createCacheSetterGetterFunc(hook);
        const newSetterGetter = Object.assign(setterGetter, {
            _hook: hook
        });
        return newSetterGetter;
    }
    function mountCache(key, options) {
        const hook = new Cache(key, options, currentRunnerScope);
        currentRunnerScope.addHook(hook);
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        const setterGetter = createCacheSetterGetterFunc(hook);
        const newSetterGetter = Object.assign(setterGetter, {
            _hook: hook
        });
        return newSetterGetter;
    }
    function updateComputed(fn) {
        var _a, _b;
        const { valid, currentIndex } = updateValidation();
        if (!valid) {
            currentRunnerScope.addHook(undefined);
            return createUnaccessGetter(currentIndex);
        }
        const initialValue = (_a = currentRunnerScope.runnerContext.initialData[currentIndex]) === null || _a === void 0 ? void 0 : _a[1];
        const timestamp = (_b = currentRunnerScope.runnerContext.initialData[currentIndex]) === null || _b === void 0 ? void 0 : _b[2];
        const hook = new Computed(fn, currentRunnerScope);
        currentRunnerScope.addHook(hook);
        // @TODO: update computed won't trigger
        hook._internalValue = initialValue;
        hook.init = false;
        if (timestamp) {
            hook.modifiedTimstamp = timestamp;
        }
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        const getter = () => {
            return hook.value;
        };
        const newGetter = Object.assign(getter, {
            _hook: hook
        });
        return newGetter;
    }
    function mountComputed(fn) {
        const hook = new Computed(fn, currentRunnerScope);
        currentRunnerScope.addHook(hook);
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        const getter = () => {
            return hook.value;
        };
        const newGetter = Object.assign(getter, {
            _hook: hook
        });
        return newGetter;
    }
    function updateComputedInServer(fn) {
        var _a, _b;
        const { valid, currentIndex } = updateValidation();
        if (!valid) {
            currentRunnerScope.addHook(undefined);
            return createUnaccessGetter(currentIndex);
        }
        const initialValue = (_a = currentRunnerScope.runnerContext.initialData[currentIndex]) === null || _a === void 0 ? void 0 : _a[1];
        const timestamp = (_b = currentRunnerScope.runnerContext.initialData[currentIndex]) === null || _b === void 0 ? void 0 : _b[2];
        const hook = new Computed(fn, currentRunnerScope)
            ;
        currentRunnerScope.addHook(hook);
        /** @TODO: update computed won't trigger */
        hook._internalValue = initialValue;
        hook.init = false;
        if (timestamp) {
            hook.modifiedTimstamp = timestamp;
        }
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        const getter = () => {
            return hook.value;
        };
        const newGetter = Object.assign(getter, {
            _hook: hook
        });
        return newGetter;
    }
    function mountComputedInServer(fn) {
        const hook = new Computed(fn, currentRunnerScope)
            ;
        currentRunnerScope.addHook(hook);
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        const getter = () => {
            return hook.value;
        };
        const newGetter = Object.assign(getter, {
            _hook: hook
        });
        return newGetter;
    }
    function state(initialValue) {
        if (!currentRunnerScope) {
            throw new Error('[state] must under a tarat runner');
        }
        return exports.currentHookFactory.state(initialValue);
    }
    function model(e, q, op) {
        if (!currentRunnerScope) {
            throw new Error('[model] must under a tarat runner');
        }
        return exports.currentHookFactory.prisma(e, q, op);
    }
    function writeModel(source, q) {
        if (!currentRunnerScope) {
            throw new Error('[writePrisma] must under a tarat runner');
        }
        return exports.currentHookFactory.writePrisma(source, q);
    }
    function prisma(e, q, op) {
        if (!currentRunnerScope) {
            throw new Error('[model] must under a tarat runner');
        }
        return exports.currentHookFactory.prisma(e, q, op);
    }
    function writePrisma(source, q) {
        if (!currentRunnerScope) {
            throw new Error('[writePrisma] must under a tarat runner');
        }
        return exports.currentHookFactory.writePrisma(source, q);
    }
    function cache(key, options) {
        if (!currentRunnerScope) {
            throw new Error('[cache] must under a tarat runner');
        }
        return exports.currentHookFactory.cache(key, options);
    }
    function computed(fn) {
        if (!currentRunnerScope) {
            throw new Error('[computed] must under a tarat runner');
        }
        return exports.currentHookFactory.computed(fn);
    }
    function computedInServer(fn) {
        if (!currentRunnerScope) {
            throw new Error('[computed] must under a tarat runner');
        }
        return exports.currentHookFactory.computedInServer(fn);
    }
    function updateInputCompute(func) {
        const { hooks, initialHooksSet } = currentRunnerScope;
        const currentIndex = hooks.length;
        const valid = !initialHooksSet || initialHooksSet.has(currentIndex);
        if (!valid) {
            currentRunnerScope.addHook(undefined);
            return createUnaccessGetter(currentIndex);
        }
        return mountInputCompute(func);
    }
    function mountInputCompute(func) {
        const hook = new InputCompute(func, currentRunnerScope);
        currentRunnerScope.addHook(hook);
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        const wrapFunc = (...args) => {
            return hook.run(...args);
        };
        wrapFunc._hook = hook;
        return wrapFunc;
    }
    function inputCompute(func) {
        if (!currentRunnerScope) {
            throw new Error('[inputCompute] must under a tarat runner');
        }
        const wrapFunc = exports.currentHookFactory.inputCompute(func);
        return wrapFunc;
    }
    function updateInputComputeInServer(func) {
        const { hooks, initialHooksSet } = currentRunnerScope;
        const currentIndex = hooks.length;
        const valid = !initialHooksSet || initialHooksSet.has(currentIndex);
        if (!valid) {
            currentRunnerScope.addHook(undefined);
            return createUnaccessGetter(currentIndex);
        }
        return mountInputComputeInServer(func);
    }
    function mountInputComputeInServer(func) {
        const hook = new InputComputeInServer(func, currentRunnerScope);
        currentRunnerScope.addHook(hook);
        currentReactiveChain === null || currentReactiveChain === void 0 ? void 0 : currentReactiveChain.add(hook);
        const wrapFunc = (...args) => {
            return hook.run(...args);
        };
        wrapFunc._hook = hook;
        return wrapFunc;
    }
    function inputComputeInServer(func) {
        if (!currentRunnerScope) {
            throw new Error('[inputComputeServer] must under a tarat runner');
        }
        /**
         * running in client should post request to server
         * if already in server, should execute directly
         */
        {
            return inputCompute(func);
        }
    }
    /**
     *
     *
     *
     *
     *  connect util methods
     *
     *
     *
     *
     */
    function after(callback, targets) {
        callback = makeBatchCallback(callback);
        targets.forEach(target => {
            if (target._hook) {
                if (target._hook instanceof InputCompute) {
                    target._hook.on(EHookEvents.afterCalling, callback);
                }
                else {
                    target._hook.on(EHookEvents.change, callback);
                }
            }
        });
    }
    function before(callback, targets) {
        callback = makeBatchCallback(callback);
        targets.forEach(target => {
            if (target._hook) {
                if (target._hook instanceof InputCompute) {
                    target._hook.on(EHookEvents.beforeCalling, callback);
                }
            }
        });
    }
    function combineLatest(arr) {
        return () => {
            const latestState = arr.slice(1).reduce((latest, hook) => {
                const { _hook } = hook;
                if (!_hook) {
                    return latest;
                }
                if (!latest._hook) {
                    return hook;
                }
                if (_hook.modifiedTimstamp > latest._hook.modifiedTimstamp) {
                    return hook;
                }
                return latest;
            }, arr[0]);
            return latestState === null || latestState === void 0 ? void 0 : latestState();
        };
    }
    /**
     * using another Driver inside of Driver
     * the important thing is that should consider how to compose their depsMap
     */
    function compose(f, args) {
        if (!currentRunnerScope) {
            throw new Error('[compose] must run side of Driver');
        }
        const startIndex = currentRunnerScope.hooks.length;
        let names = getNames(f);
        const driverName = getName(f);
        if (driverName && names) {
            const composeIndex = currentRunnerScope.composes.length;
            names = names.map(arr => [
                arr[0],
                `compose.${composeIndex}.${driverName}.${arr[1]}`
            ]);
            currentRunnerScope.appendComposeNames(startIndex, names);
        }
        const endIndex = startIndex + names.length;
        const deps = getDeps(f);
        currentRunnerScope.appendComposeDeps(startIndex, endIndex, deps);
        const insideResult = executeDriver(f, args);
        currentRunnerScope.composes.push(insideResult);
        return insideResult;
    }
    function connectModel(modelGetter, dataGetter) {
        modelGetter._hook.setGetter(dataGetter);
    }
    function progress(getter) {
        const hook = getter._hook;
        return () => ({
            state: hook.init
                ? exports.EScopeState.init
                : hook.pending
                    ? exports.EScopeState.pending
                    : exports.EScopeState.idle
        });
    }

    exports.Cache = Cache;
    exports.CacheInitialSymbol = CacheInitialSymbol;
    exports.ClientComputed = ClientComputed;
    exports.ClientModel = ClientModel;
    exports.ClientPrisma = ClientPrisma;
    exports.ClientWriteModel = ClientWriteModel;
    exports.ClientWritePrisma = ClientWritePrisma;
    exports.Computed = Computed;
    exports.ComputedInitialSymbol = ComputedInitialSymbol;
    exports.CurrentRunnerScope = CurrentRunnerScope;
    exports.DataGraphNode = DataGraphNode;
    exports.Hook = Hook;
    exports.InputCompute = InputCompute;
    exports.Model = Model;
    exports.ModelEvent = ModelEvent;
    exports.Prisma = Prisma;
    exports.ReactiveChain = ReactiveChain;
    exports.Runner = Runner;
    exports.RunnerContext = RunnerContext;
    exports.State = State;
    exports.Watcher = Watcher;
    exports.WriteModel = WriteModel;
    exports.WritePrisma = WritePrisma;
    exports.after = after;
    exports.applyPatchesToObject = applyPatchesToObject;
    exports.before = before;
    exports.cache = cache;
    exports.calculateChangedPath = calculateChangedPath;
    exports.calculateDiff = calculateDiff;
    exports.checkQueryWhere = checkQueryWhere;
    exports.cloneDeep = cloneDeep;
    exports.combineLatest = combineLatest;
    exports.compose = compose;
    exports.computed = computed;
    exports.computedInServer = computedInServer;
    exports.connectModel = connectModel;
    exports.constructDataGraph = constructDataGraph;
    exports.dataGrachTraverse = dataGrachTraverse;
    exports.debuggerLog = debuggerLog;
    exports.deleteKey = deleteKey;
    exports.findWithDefault = findWithDefault;
    exports.freeze = freeze;
    exports.get = get;
    exports.getDependencies = getDependencies;
    exports.getDependentPrevNodes = getDependentPrevNodes;
    exports.getDependentPrevNodesWithBlock = getDependentPrevNodesWithBlock;
    exports.getDeps = getDeps;
    exports.getEnv = getEnv;
    exports.getInfluencedNextNodes = getInfluencedNextNodes;
    exports.getName = getName;
    exports.getNames = getNames;
    exports.getNextNodes = getNextNodes;
    exports.getOwnPropertyDescriptors = getOwnPropertyDescriptors;
    exports.getPlugin = getPlugin;
    exports.getPrevNodes = getPrevNodes;
    exports.getRelatedIndexes = getRelatedIndexes;
    exports.getShallowDependentPrevNodes = getShallowDependentPrevNodes;
    exports.getShallowInfluencedNextNodes = getShallowInfluencedNextNodes;
    exports.getShallowRelatedIndexes = getShallowRelatedIndexes;
    exports.hasSourceHookFactoryNames = hasSourceHookFactoryNames;
    exports.hookFactoryFeatures = hookFactoryFeatures;
    exports.hookFactoryNames = hookFactoryNames;
    exports.initiativeComputeHookFactoryNames = initiativeComputeHookFactoryNames;
    exports.inputCompute = inputCompute;
    exports.inputComputeInServer = inputComputeInServer;
    exports.internalProxy = internalProxy;
    exports.isArray = isArray;
    exports.isAsyncFunc = isAsyncFunc;
    exports.isDataPatch = isDataPatch;
    exports.isDef = isDef;
    exports.isEqual = isEqual;
    exports.isFunc = isFunc;
    exports.isGenerator = isGenerator;
    exports.isModelPatch = isModelPatch;
    exports.isPrimtive = isPrimtive;
    exports.isPromise = isPromise;
    exports.isState = isState;
    exports.isUndef = isUndef;
    exports.last = last;
    exports.likeObject = likeObject;
    exports.loadPlugin = loadPlugin;
    exports.log = log;
    exports.makeBatchCallback = makeBatchCallback;
    exports.map = map;
    exports.mapGraph = mapGraph;
    exports.mapGraphSetToIds = mapGraphSetToIds;
    exports.model = model;
    exports.mountHookFactory = mountHookFactory;
    exports.nextTick = nextTick;
    exports.ownKeys = ownKeys;
    exports.prisma = prisma;
    exports.progress = progress;
    exports.runGenerator = runGenerator;
    exports.set = set;
    exports.setCurrentComputed = setCurrentComputed;
    exports.setEnv = setEnv;
    exports.setGlobalModelEvent = setGlobalModelEvent;
    exports.shallowCopy = shallowCopy;
    exports.shortValue = shortValue;
    exports.startdReactiveChain = startdReactiveChain;
    exports.state = state;
    exports.stopReactiveChain = stopReactiveChain;
    exports.updateHookFactory = updateHookFactory;
    exports.writeInitialSymbol = writeInitialSymbol;
    exports.writeModel = writeModel;
    exports.writePrisma = writePrisma;
    exports.writePrismaInitialSymbol = writePrismaInitialSymbol;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
