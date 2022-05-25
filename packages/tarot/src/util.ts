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

export function isFunc(f?: Function | any) {
  return typeof f === 'function'
}

export function isAsyncFunc(f?: any) {
  return f && f[Symbol.toStringTag] === 'AsyncFunction'
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
  data: Array<['data' | 'patch', any | IPatch[] | null]>
  index: number
  args?: any[]
}

interface IModelConfig {
  find: (entity: string, where: IModelQuery['where']) => Promise<any>
  update: (entity: string, where: IModelData) => Promise<number[]>
  create: (entity: string, data: IModelCreateData) => Promise<any>
  remove: (entity: string, data: Omit<IModelData, 'data'>) => Promise<number[]>
  //
  executeDiff: (d: IDiff[]) => Promise<void>
  postDiffToServer: (d: IDiff[]) => Promise<void>
  //
  postComputeToServer: (c: IHookContext) => Promise<IHookContext['data']>
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

export interface IPatch {
  op: 'replace' | 'add' | 'remove'
  path: (string | number)[]
  value?: any
}

export interface IDiff {
  target?: number
  patches: IPatch[]
}

/**
 * 计算diff，决定要进行的数据库操作
 * @TODO
 */
export function calculateDiff(data: any | any[], p: IPatch[]): IDiff[] {
  return []
}

// execute in server side
export function getExecuteDiff() {
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
