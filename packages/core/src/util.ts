import { applyPatches } from 'immer'
import { IQueryWhere } from './plugin'
import co from './lib/co'
export const isArray = Array.isArray
/* copy from immer's common.ts  */
export type AnyObject = { [key: string]: any }
export const ownKeys: (target: AnyObject) => PropertyKey[] = Reflect.ownKeys
export const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors

export function shallowCopy(base: any): any {
  if (isArray(base)) return Array.prototype.slice.call(base)
  const descriptors = getOwnPropertyDescriptors(base)
  let keys = ownKeys(descriptors)
  for (let i = 0; i < keys.length; i++) {
    const key: any = keys[i]
    const desc = descriptors[key]
    if (desc.writable === false) {
      desc.writable = true
      desc.configurable = true
    }
    // like object.assign, we will read any _own_, get/set accessors. This helps in dealing
    // with libraries that trap values, like mobx or vue
    // unlike object.assign, non-enumerables will be copied as well
    if (desc.get || desc.set)
      descriptors[key] = {
        configurable: true,
        writable: true, // could live with !!desc.set as well here...
        enumerable: desc.enumerable,
        value: base[key]
      }
  }
  return Object.create(Object.getPrototypeOf(base), descriptors)
}
/* HELPERS */
const getKeys = Object.keys

export const isEqual = (x: any, y: any): boolean => {
  if (x === y) return true

  if (
    typeof x === 'object' &&
    typeof y === 'object' &&
    x !== null &&
    y !== null
  ) {
    if (isArray(x)) {
      if (isArray(y)) {
        let xLength = x.length
        let yLength = y.length

        if (xLength !== yLength) return false

        while (xLength--) {
          if (!isEqual(x[xLength], y[xLength])) return false
        }

        return true
      }

      return false
    } else if (isArray(y)) {
      return false
    } else {
      let xKeys = getKeys(x)
      let xLength = xKeys.length
      let yKeys = getKeys(y)
      let yLength = yKeys.length

      if (xLength !== yLength) return false

      while (xLength--) {
        const key = xKeys[xLength]
        const xValue = x[key]
        const yValue = y[key]

        if (!isEqual(xValue, yValue)) return false

        if (yValue === undefined && !Reflect.has(y, key)) return false
      }
    }

    return true
  }

  return x !== x && y !== y
}

export function last(arr: any[]) {
  return arr[arr.length - 1]
}
export function cloneDeep(obj?: any) {
  return obj && JSON.parse(JSON.stringify(obj))
}

export function applyPatchesToObject(target: any, patches: IPatch[]) {
  patches.forEach((p: IPatch) => {
    switch (p.op) {
      case 'add':
        set(target, p.path, p.value)
        break
      case 'remove':
        deleteKey(target, p)
        break
      case 'replace':
        set(target, p.path, p.value)
        break
    }
  })
}

export function isPrimtive(v: any) {
  if (v === null) {
    return true
  }
  const type = typeof v
  return [
    'undefined',
    'number',
    'symbol',
    'string',
    'bigint',
    'boolean'
  ].includes(type)
}

export function deleteKey(obj: any, p: IPatch) {
  const { path, value } = p
  let tail = path.length > 0 ? get(obj, path.slice(0, -1)) : obj
  const key = last(path)
  if (tail instanceof Set) {
    tail.delete(value)
  }
  if (tail instanceof Map) {
    tail.delete(key)
  } else {
    delete tail[key]
  }
}

export function set(obj: any, path: string | (number | string)[], value: any) {
  let base = obj
  const currentFieldPath = isArray(path)
    ? path.slice(0)
    : path.split
    ? path.split('.')
    : [path]
  if (currentFieldPath.length > 0) {
    const fieldName = currentFieldPath.pop()
    currentFieldPath.forEach((p, i) => {
      if (base[p] === undefined) base[p] = {}
      base = base[p]
    })
    if (base instanceof Map) {
      base.set(fieldName, value)
    } else if (base instanceof Set) {
      base.add(value)
    } else {
      base[fieldName!] = value
    }
  }
}

export function get(obj: any, path: string | (number | string)[]) {
  let base = obj
  const pathArr = isArray(path)
    ? path.slice(0)
    : path.split
    ? path.split('.')
    : [path]
  if (pathArr.length === 0) {
    return obj
  }
  const currentPathArr = pathArr.slice(0, -1)
  const key = last(pathArr)
  for (const p of currentPathArr) {
    if (base[p] === undefined) return undefined
    base = base[p]
  }
  if (base instanceof Map) {
    return base.get(key)
  }
  return base[key]
}

export function map(
  target: object | any[],
  callback: (v: any, i: number, self: any[]) => any
) {
  if (!target || typeof target !== 'object') {
    throw new Error('can not map')
  }
  if (isArray(target)) {
    return target.map(callback)
  }
  return Object.values(target).map(callback)
}

export function likeObject(target: any) {
  return target && typeof target === 'object'
}

export function isDef(v?: any) {
  return typeof v !== 'undefined'
}
export function isUndef(v?: any) {
  return typeof v === 'undefined'
}

export function isFunc(f?: Function | any) {
  return typeof f === 'function'
}

export function isAsyncFunc(f?: any) {
  return f && f[Symbol.toStringTag] === 'AsyncFunction'
}
export function isPromise(p?: any) {
  return p && (p instanceof Promise || !!p.then)
}

export function isGenerator(g: any) {
  return g && 'function' == typeof g.next && 'function' == typeof g.throw
}


export function nextTick(fn: () => void) {
  const st = setTimeout(fn, 0)
  return () => clearTimeout(st)
}

export type TContextData =
  | 'data'
  | 'unserialized'
  | 'state'
  | 'patch'
  | 'inputCompute'
  | 'model'
  | 'clientModel'
  | 'cache'
  | 'computed'

export interface IHookContext {
  initialArgList: any[]
  data: Array<
    | [TContextData, any | IPatch[], number]
    | [TContextData, null]
    | [TContextData]
  >
  index?: number
  args: any[]
  name: string
}

export type THookDeps = Array<
  [
    'h',
    number,
    (number | ['c', number, string])[], // get
    (number | ['c', number, string])[]? // set
  ]
>

export function findWithDefault<T>(
  arr: T[],
  fn: (a: T) => boolean,
  defaults?: T
): T | void {
  let e = arr.find(fn)
  if (!e && defaults) {
    e = defaults
    arr.push(e)
  }
  return e
}

export interface IPatch {
  op: 'replace' | 'add' | 'remove'
  path: (string | number)[]
  value?: any
}

export interface IStackUnit {
  value: {
    [k: string]: any
  }
  source: {
    [k: string]: any
  }
  currentFieldPath: string
}

/**
 * ?????????patch?????????????????????splice???????????????????????????????????????patches???????????????immer?????????????????????????????????
 * arr.splice(0, 1) -> 0 ??????????????????????????????length = length -1 ??????
 * ???????????????????????????length
 * ???????????????, ??????????????????????????????length
 *
 * ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????equal????????????????????????????????????????????????????????????????????????????????????????????????????????????
 *  ??????DB????????????????????????????????????id?????????????????????DB?????????????????????
 *    ??????????????????????????????????????????????????????????????????id????????????????????????????????????????????????????????????????????????????????????????????????????????????id????????????????????????????????????????????????????????????????????????????????????
 *      ??????????????????????????????model????????????patch???????????????????????????????????????
 */

function preparePatches2(data: any | any[], ps: IPatch[]) {
  const lengthPatchIndexes: Array<[number, any, (string | number)[]]> = []
  ps.forEach((p, i) => {
    const source = p.path.length === 1 ? data : get(data, p.path.slice(0, -1))
    if (isArray(source) && last(p.path) === 'length') {
      lengthPatchIndexes.push([i, source, p.path.slice(0, -1)])
    }
  })
  if (lengthPatchIndexes.length > 0) {
    const allInsertPatches: Array<[number, number, IPatch[]]> = []

    lengthPatchIndexes.forEach(([index, source, currentPath]) => {
      const newArrLength = ps[index].value
      const sourcePatches: IPatch[] = []

      let startMovingIndex = index - 1
      for (index - 1; startMovingIndex >= 0; startMovingIndex--) {
        const p = ps[startMovingIndex]
        const currentSource =
          p.path.length === 1 ? data : get(data, p.path.slice(0, -1))
        if (currentSource === source) {
          sourcePatches.unshift({
            ...p,
            path: p.path.slice(-1)
          })
        } else {
          break
        }
      }
      const newSource = applyPatches(source, sourcePatches)

      const reservedPatches: IPatch[] = []
      const newInsertPatches: IPatch[] = []

      sourcePatches.forEach(p => {
        // value: maybe add, reserve
        // path: maybe remove, reserve (including length)
        const { path, value } = p
        const existInOldIndex = source.findIndex((v: any) => isEqual(v, value))
        const existInNewIndex = newSource.findIndex((v: any) =>
          isEqual(v, value)
        )
        const alreadyReversed1 = reservedPatches.find(p =>
          isEqual(p.value, value)
        )
        // add
        if (existInOldIndex === -1 && existInNewIndex > -1) {
          newInsertPatches.push({
            op: 'add',
            value,
            path: currentPath.concat(path)
          })
        } else if (existInOldIndex > -1 && existInNewIndex > -1) {
          if (!alreadyReversed1) {
            reservedPatches.push({
              op: 'replace',
              value,
              path: currentPath.concat(path)
            })
          }
        }
        const oldPathValue = get(source, path)
        const oldExistInNewIndex = newSource.findIndex((v: any) =>
          isEqual(v, oldPathValue)
        )
        const alreadyReversed2 = reservedPatches.find(p =>
          isEqual(p.value, oldPathValue)
        )
        if (oldExistInNewIndex > -1) {
          if (!alreadyReversed2) {
            reservedPatches.push({
              op: 'replace',
              value: oldPathValue,
              path: currentPath.concat(path)
            })
          }
        } else {
          newInsertPatches.push({
            op: 'remove',
            value: oldPathValue,
            path: currentPath.concat(path)
          })
        }
      })
      // directly remove tail
      if (newArrLength < source.length) {
        let si = newArrLength

        let reservedDataValuesMarks = reservedPatches.map(({ value }) => value)
        while (si < source.length) {
          const oldReservedLength = reservedDataValuesMarks.length
          // @TODO: immer???object????????????????????????????????????????????????????????????isEqual
          // ??????????????????????????????????????????????????????????????????
          reservedDataValuesMarks = reservedDataValuesMarks.filter(
            v => !isEqual(source[si], v)
          )
          if (reservedDataValuesMarks.length === oldReservedLength) {
            // ???????????????????????????????????????????????????
            newInsertPatches.push({
              op: 'remove',
              value: source[si],
              path: currentPath.concat(si)
            })
          }
          si++
        }
      }
      // newInsertPatches.length must gt 1
      allInsertPatches.push([
        startMovingIndex + 1,
        index - startMovingIndex,
        newInsertPatches
      ])
    })
    let offset = 0
    allInsertPatches.forEach(([st, length, arr]) => {
      ps.splice(st - offset, length, ...arr)
      offset = offset + length - arr.length
    })
  }

  return ps
}

export type IDiff = ReturnType<typeof calculateDiff>
/**
 * ??????patch??????diff????????????????????????????????????
 */
export function calculateDiff(data: any | any[], ps: IPatch[]) {
  data = cloneDeep(data)

  ps = preparePatches2(data, ps)

  let create: IStackUnit[] = []
  let update: IStackUnit[] = []
  const remove: IStackUnit[] = []

  ps.filter(p => p.path.length > 0).forEach(p => {
    if (p.path && p.path.length > 0) {
      const source = p.path.length === 1 ? data : get(data, p.path.slice(0, -1))
      // CAUTION: ??????????????????
      const pathSkipArr = p.path.filter((k, i) => {
        return !isArray(get(data, p.path.slice(0, i)))
      })

      const patchValue = Reflect.has(p, 'value') ? p.value : get(data, p.path)

      /** 4??????????????????model??????????????? -> ??????????????????
       *
       * ???????????????: a.0.b  a.b  a.b.0   0.a.b ??? ??????????????????????????????????????????????????? a.b
       *
       * ????????????current??????, root = { a:{ b:[x]} } -> root.a.b.0?????????->??????, source=array
       *   x=object --> a.b
       *   x=primitiv --> invalid
       * root={a:{ b:x }} -> root.a.b ??????->??????, source=object
       *   x=object --> a.b
       *   x=primitive --> a
       * root=[{ a: { b: x } }] -> root.0.a.b??? ??????->??????->??????, source=object
       *   x=object --> a.b
       *   x=primitive --> a
       * root=[{ a: [{ b: x }] }] -> root.a.0.b??? ??????->??????, source=array
       *   x=object -> a.b
       *   x=primtive --> a
       */
      const currentFieldPath = pathSkipArr
        .slice(0, likeObject(patchValue) ? Infinity : -1)
        .join('.')

      const lastPathKey = p.path[p.path.length - 1]

      switch (p.op) {
        case 'replace':
          {
            // cant handle the primitive patch in array
            if (isArray(source) && !likeObject(patchValue)) {
              return
            }
            const exist = findWithDefault(
              update,
              u => u.currentFieldPath === currentFieldPath,
              {
                source,
                value: {},
                currentFieldPath
              }
            )
            if (exist) {
              if (isArray(source)) {
                exist.value = patchValue // should bring "id"
              } else {
                Object.assign(exist.value, {
                  [lastPathKey]: patchValue
                })
              }
            }
          }
          break
        case 'add':
          {
            if (isArray(source)) {
              if (likeObject(patchValue)) {
                create.push({
                  source,
                  value: patchValue,
                  currentFieldPath
                })
              }
            } else {
              if (likeObject(patchValue)) {
                create.push({
                  source,
                  value: patchValue,
                  currentFieldPath
                })
              } else {
                const exist = findWithDefault(
                  update,
                  u => u.currentFieldPath === currentFieldPath,
                  {
                    source,
                    value: {},
                    currentFieldPath
                  }
                )
                if (exist) {
                  Object.assign(exist.value, {
                    [lastPathKey]: patchValue
                  })
                }
              }
            }
          }
          break
        case 'remove':
          {
            if (likeObject(patchValue)) {
              if (isArray(source)) {
                remove.push({
                  source,
                  value: patchValue,
                  currentFieldPath
                })
              } else {
                remove.push({
                  source,
                  value: patchValue,
                  currentFieldPath
                })
              }
            } else {
              const exist = findWithDefault(
                update,
                u => u.currentFieldPath === currentFieldPath,
                {
                  source,
                  value: {},
                  currentFieldPath
                }
              )
              if (exist) {
                Object.assign(exist.value, {
                  [lastPathKey]: null
                })
              }
            }
          }
          break
      }
    }
  })

  //combines
  remove.forEach(u => {
    create = create.filter(c => c.currentFieldPath === u.currentFieldPath)
    update = update.filter(c => c.currentFieldPath === u.currentFieldPath)
  })

  return {
    create,
    update,
    remove
  }
}
export type TPath = (string | number)[]
/**
 * ???????????????????????????patch?????????
 * ??????????????????????????????????????????????????????????????????????????????????????????patch????????????????????????
 * patch???????????????????????????????????????????????????????????????????????????
 * a.0.b.0.c --> a ??????
 * a.b.c --> a.b.c ????????????????????????a.b??????????????????????????????????????????????????????b??????primitive???
 */
export function calculateChangedPath(source: any, ps: IPatch[]): TPath[] {
  if (isArray(source)) {
    return [['']] // root
  }
  const result: TPath[] = []
  ps.forEach(p => {
    const i = p.path.findIndex((v, i) => {
      return (
        typeof v === 'number' && isArray(get(source, p.path.slice(0, i + 1)))
      )
    })
    if (i > -1) {
      result.push(p.path.slice(0, i))
    } else {
      result.push(p.path.slice())
    }
  })
  return result
}

// execute in server side
// export function getDiffExecution() {
//   return getModelConfig().executeDiff
// }
// // execute in client side
// export function getPostDiffToServer() {
//   return getModelConfig().postDiffToServer
// }

let currentEnv: null | string = null
export function setEnv(env: 'server' | 'client') {
  currentEnv = env
}

export function getEnv() {
  return {
    client: currentEnv === 'client',
    server: currentEnv === 'server'
  }
}

export function traverseValues(target: any, callback: (v: any) => void) {
  map(target, v => {
    callback(v)
    if (likeObject(v)) {
      traverseValues(v, callback)
    }
  })
}

export let enableLog: boolean = false
export function log(pre: string, ...rest: any[]) {
  if (enableLog) {
    console.log(`[${process.env.TARGET || ''}] [${pre}]`, ...rest)
  }
}
export function debuggerLog(open: boolean) {
  enableLog = open
}

export function checkQueryWhere(where: IQueryWhere['where']): boolean {
  return where
    ? !Object.values(where).some(v => {
        if (typeof v === 'object') {
          return !checkQueryWhere(v as any)
        }
        return v === undefined
      })
    : true
}

export function getDeps(f: BM) {
  return f.__deps__
}

export interface BM extends Function {
  (...prop: any): any
  __deps__?: THookDeps
  __name__?: string
}

// export type BM = (...prop: any) => any

export function runGenerator (gen: Generator, onResume: () => void, onSuspend: () => void) {
  return co(gen, {
    onResume: onResume,
    onSuspend: onSuspend
  })
}