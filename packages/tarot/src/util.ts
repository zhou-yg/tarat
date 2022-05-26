export function isArray (arr?: any) {
  return Array.isArray(arr)
}

export function cloneDeep (obj?: any) {
  return obj && JSON.parse(JSON.stringify(obj))
}

export function set (obj: any, path: string | (number | string)[], value: any) {
  let base = obj
  const currentPath = Array.isArray(path) ? path.slice(0) : path.split('.')
  if (currentPath.length > 0) {
    const fieldName = currentPath.pop()
    currentPath.forEach((p, i) => {
      if (base[p] === undefined) base[p] = {}
      base = base[p]
    })
    base[fieldName!] = value
  }
}

export function get (obj: any, path: string | (number | string)[]) {
  let base = obj
  const pathArr = Array.isArray(path) ? path.slice(0) : path.split('.')
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

function mergeStack (target: object, p: IPatch[]) {

  
}


interface IStackUnit {
  value: {
    [k: string]: any
  }
  currentPath: string 
}

export type IDiff = ReturnType<typeof calculateDiff>

/**
 * 根据patch计算diff，决定要进行的数据库操作
 */
export function calculateDiff(data: any | any[], ps: IPatch[]) {
  data = cloneDeep(data)

  let create: IStackUnit[] = []
  let update: IStackUnit[] = []
  const remove: IStackUnit[] = []

  ps
  .filter(p => p.path.length > 0)
  .forEach(p => {
    if (p.path && p.path.length > 0) {
      const target = p.path.length === 1 ? data : get(data, p.path.slice(0, -1))
      // CAUTION: 是不是太暴力
      const pathSkipArr = p.path.filter((k, i) => {
        return !isArray(get(data, p.path.slice(0, i))) || i === p.path.length - 1
      })

      const currentPath = pathSkipArr.slice(0, -1).join('.')

      const lastPathKey = p.path[p.path.length - 1]

      switch (p.op) {
        case 'replace':
          {
            const exist = findWithDefault(update, (u) => u.currentPath === currentPath, {
              
              value: {},
              currentPath,
            })
            if (exist) {
              if (Array.isArray(target)) {
                exist.value = p.value // should bring "id"
              } else {
                Object.assign(exist.value, {
                  [lastPathKey]: p.value
                })
              }
            }
          }
          break;
        case 'add':
          {
            if (Array.isArray(target)) {
              create.push({
                
                value: p.value,
                currentPath,
              })
            } else {
              const addData = p.value
              if (likeObject(addData)) {
                create.push({
                  value: addData,
                  currentPath: p.path.join('.'), // add object into object, must have path
                })
              } else {
                const exist = findWithDefault(update, (u) => u.currentPath === currentPath, {
                  
                  value: {},
                  currentPath,
                })                                            
                if (exist) {
                  Object.assign(exist.value, {
                    [lastPathKey]: p.value
                  })
                }  
              }
            }
          }
          break;
        case 'remove':
          {
            const removedData = get(data, p.path)
            if (likeObject(removedData)) {
              remove.push({
                value: removedData,
                currentPath: p.path.join('.'), // remove obj from obj, muse have path
            })
            } else {
              const exist = findWithDefault(update, (u) => u.currentPath === currentPath, {
                
                value: {},
                currentPath,
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
    create = create.filter(c => c.currentPath === u.currentPath)
    update = update.filter(c => c.currentPath === u.currentPath)
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
