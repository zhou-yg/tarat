import isEqual from './isEqual';

export function isArray (arr?: any) {
  return Array.isArray(arr)
}
export function last (arr: any[]) {
  return arr[arr.length - 1]
}
export function cloneDeep (obj?: any) {
  return obj && JSON.parse(JSON.stringify(obj))
}

export function set (obj: any, path: string | (number | string)[], value: any) {
  let base = obj
  const currentFieldPath = Array.isArray(path) ? path.slice(0) : path.split ? path.split('.') : [path]
  if (currentFieldPath.length > 0) {
    const fieldName = currentFieldPath.pop()
    currentFieldPath.forEach((p, i) => {
      if (base[p] === undefined) base[p] = {}
      base = base[p]
    })
    base[fieldName!] = value
  }
}

export function get (obj: any, path: string | (number | string)[]) {
  let base = obj
  const pathArr = Array.isArray(path) ? path.slice(0) : path.split ? path.split('.') : [path]
  for (const p of pathArr) {
    if (base[p] === undefined) return undefined
    base = base[p]
  }
  return base
}

export function map(
  target: object | any[],
  callback: (v: any, i: number, self: any[]) => any
) {
  if (!target || typeof target !== 'object') {
    throw new Error('can not map')
  }
  if (Array.isArray(target)) {
    return target.map(callback)
  }
  return Object.values(target).map(callback)
}

export function likeObject(target: any) {
  return target && typeof target === 'object'
}

export function isDef (v?: any) {
  return typeof v !== 'undefined'
}
export function isUndef (v?: any) {
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

export function nextTick (fn: () => void) {
  const st = setTimeout(fn, 0)
  return () => clearTimeout(st)
}

interface IQueryInclude {
  [k: string]:
    | boolean
    | {
        include: IQueryInclude
      }
}
interface IQuerySelect {
  [k: string]:
    | boolean
    | {
        select: IQuerySelect
      }
}

export interface IQueryWhere {
  where?: {
    [k: string]: any
  }
  skip?: number
  take?: number
  include?: IQueryInclude
  select?: IQuerySelect
  orderBy?: {
    [k: string]: 'desc' | 'asc'
  }
  cursor?: {
    id?: number
  }
}

export interface IModelQuery {
  entity: string
  where: IQueryWhere
}
interface IModelData {
  where: { id: number }
  data: {
    [k: string]:
      | any
      | {
          connect?: { id: number }
          create?: IModelData
        }
  }
}

type IModelCreateData = Omit<IModelData, 'where'> | Omit<IModelData, 'where'>[]

export interface IHookContext {
  data: Array<[
    'data' | 'patch' |  'inputCompute' | 'model',
    any | IPatch[] | null
  ]>
  index?: number
  args?: any[]
}

interface IModelConfig {
  find: (entity: string, where: IModelQuery['where']) => Promise<any>
  update: (entity: string, where: IModelData) => Promise<number[]>
  create: (entity: string, data: IModelCreateData) => Promise<any>
  remove: (entity: string, data: Omit<IModelData, 'data'>) => Promise<number[]>
  //
  executeDiff: (entity: string, d: IDiff) => Promise<void>
  postDiffToServer: (entity: string, d: IDiff) => Promise<void>
  //
  postComputeToServer: (c: IHookContext) => Promise<IHookContext>
}

let modelConfig: null | IModelConfig | (() => IModelConfig) = null
export function setModelConfig(c: IModelConfig | (() => IModelConfig)) {
  modelConfig = c
}

export function getModelConfig(): IModelConfig {
  if (isFunc(modelConfig)) {
    return (modelConfig as () => IModelConfig)()
  }
  return modelConfig as IModelConfig
}

export function getModelFind() {
  return getModelConfig().find
}
export function getModelUpdate() {
  return getModelConfig().update
}
export function getModelCreate() {
  return getModelConfig().create
}
export function getModelRemove() {
  return getModelConfig().remove
}

export function findWithDefault<T>(arr: T[], fn: (a: T) => boolean, defaults?: T): T | void {
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

interface IStackUnit {
  value: {
    [k: string]: any
  }
  source: {
    [k: string]: any
  }
  currentFieldPath: string 
}

/**
 * 预处理patch，推导数组通过splice，找到被删除的元素。修正的patches语义已经跟immer冲突了，不能再二次使用
 * arr.splice(0, 1) -> 0 后面的全部前移，最后length = length -1 完成
 * 删除尾部，直接减少length 
 * 删除非尾部, 尾部往前占位，再减少length
 */
function preparePatches (data: any | any[], ps: IPatch[]) {
  const lengthPatchIndexes: Array<[number, any]> = []
  ps.forEach((p, i) => {
    const source = p.path.length === 1 ? data : get(data, p.path.slice(0, -1))
    if (isArray(source) && last(p.path) === 'length') {
      lengthPatchIndexes.push([i, source])
    }
  })
  if (lengthPatchIndexes.length > 0) {

    const newInsertPatches: Array<[number, number, IPatch[]]> = []

    lengthPatchIndexes.forEach(([index, source]) => {
      const newArrLength = ps[index].value
      let willRemovedDataPath: (number | string)[][] = []
      let reservedDataValues: any[] = []
      
      let startMovingIndex = index - 1
      for (index - 1; startMovingIndex >= 0; startMovingIndex--) {
        const p = ps[startMovingIndex]
        const currentSource = p.path.length === 1 ? data : get(data, p.path.slice(0, -1))
        if (currentSource === source) {
          willRemovedDataPath = willRemovedDataPath.filter(pathArr => {
            return !isEqual(p.value, get(data, pathArr))
          })
          willRemovedDataPath.push(p.path)
          reservedDataValues.push(p.value)
        } else {
          break
        }
      }
      // directly remove tail
      if (willRemovedDataPath.length < source.length - newArrLength ) {
        let si = newArrLength
        while (si < source.length) {
          const oldReservedLength = reservedDataValues.length
          // @TODO: immer的object是重新生成的，在引用上并不相等，所以需要isEqual
          // 防止值被重复消费，因为数组的值有可能是重复的
          reservedDataValues = reservedDataValues.filter(v => !isEqual(source[si], v))
          if (reservedDataValues.length === oldReservedLength) {
            // 当前值是要保存的值
            willRemovedDataPath.push(
              ps[index].path.slice(0, -1).concat(si)
            )
          }
          si++
        }
      }
      const willRemovedPatches: IPatch[] = willRemovedDataPath.map(patchPath => {
        return ({
          op: 'remove',
          path: patchPath,
          value: get(data, patchPath)
        })
      })
      newInsertPatches.push([
        willRemovedDataPath.length === 0 ? index : startMovingIndex + 1,
        willRemovedDataPath.length === 0 ? 1 : index - startMovingIndex,
        willRemovedPatches
      ])
    })

    let offset = 0
    newInsertPatches.forEach(([st, length, arr]) => {
      ps.splice(
        st - offset,
        length,
        ...arr
      )
      offset = offset + length - arr.length
    })
  }

  return ps
}

export type IDiff = ReturnType<typeof calculateDiff>
/**
 * 根据patch计算diff，决定要进行的数据库操作
 */
export function calculateDiff(data: any | any[], ps: IPatch[]) {
  data = cloneDeep(data)

  ps = preparePatches(data, ps)

  let create: IStackUnit[] = []
  let update: IStackUnit[] = []
  const remove: IStackUnit[] = []

  ps
  .filter(p => p.path.length > 0)
  .forEach(p => {
    if (p.path && p.path.length > 0) {
      const source = p.path.length === 1 ? data : get(data, p.path.slice(0, -1))
      // CAUTION: 是不是太暴力
      const pathSkipArr = p.path.filter((k, i) => {
        return !isArray(get(data, p.path.slice(0, i)))
      })

      const patchValue = Reflect.has(p,'value') ? p.value : get(data, p.path)

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
      const currentFieldPath = pathSkipArr.slice(0, likeObject(patchValue) ? Infinity : -1).join('.')

      const lastPathKey = p.path[p.path.length - 1]

      switch (p.op) {
        case 'replace':
          {
            // cant handle the primitive patch in array
            if (Array.isArray(source) && !likeObject(patchValue)) {
              return
            }
            const exist = findWithDefault(update, (u) => u.currentFieldPath === currentFieldPath, {
              source,
              value: {},
              currentFieldPath,
            })
            if (exist) {
              if (Array.isArray(source)) {
                exist.value = patchValue // should bring "id"
              } else {
                Object.assign(exist.value, {
                  [lastPathKey]: patchValue
                })
              }
            }
          }
          break;
        case 'add':
          {
            if (Array.isArray(source)) {
              create.push({
                source,
                value: patchValue,
                currentFieldPath,
              })
            } else {
              if (likeObject(patchValue)) {
                create.push({
                  source,
                  value: patchValue,
                  currentFieldPath,
                })
              } else {
                const exist = findWithDefault(update, (u) => u.currentFieldPath === currentFieldPath, {
                  source,
                  value: {},
                  currentFieldPath,
                })                                            
                if (exist) {
                  Object.assign(exist.value, {
                    [lastPathKey]: patchValue
                  })
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
                  currentFieldPath,
                })                
              } else {
                remove.push({
                  source,
                  value: patchValue,
                  currentFieldPath,
                })
              }
            } else {
              const exist = findWithDefault(update, (u) => u.currentFieldPath === currentFieldPath, {
                source,
                value: {},
                currentFieldPath,
              })                                
              if (exist) {
                Object.assign(exist.value, {
                  [lastPathKey]: null
                })
              }            
            }
          }
          break;
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

// execute in server side
export function getDiffExecution () {
  return getModelConfig().executeDiff
}
// execute in client side
export function getPostDiffToServer() {
  return getModelConfig().postDiffToServer
}

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
