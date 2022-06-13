import { IDiff, IHookContext } from './util'
import type Cookies from 'cookies'

type IModelCreateData = Omit<IModelData, 'where'> | Omit<IModelData, 'where'>[]

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

interface IQuerySelect {
  [k: string]:
    | boolean
    | {
        select: IQuerySelect
      }
}

interface IQueryInclude {
  [k: string]:
    | boolean
    | {
        include: IQueryInclude
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
  query: IQueryWhere
}

type TCacheFrom = 'cookie' | 'redis' | 'localStorage' | 'sessionStorage'

export interface IRunningContext {
  cookies: {
    set: (name: string, value?: string | null, opts?: Cookies.SetOption) => void
    get: (name: string, opts?: Cookies.GetOption) => string | undefined
  }
}

const plugins: {
  Model?: {
    find(entity: string, query: IModelQuery['query']): Promise<any>
    update(entity: string, query: IModelData): Promise<number[]>
    create(entity: string, data: IModelCreateData): Promise<any>
    remove(entity: string, data: Omit<IModelData, 'data'>): Promise<number[]>
    executeDiff(entity: string, d: IDiff): Promise<void>
  }
  Cache?: {
    getValue<T>(k: string, from: TCacheFrom): Promise<T | undefined>
    setValue<T>(k: string, value: T, from: TCacheFrom): Promise<void>
    clearValue(k: string, from: TCacheFrom): void
  }
  Context?: {
    postDiffToServer(entity: string, d: IDiff): Promise<void>
    postComputeToServer(c: IHookContext): Promise<IHookContext>
    postQueryToServer(c: IHookContext): Promise<IHookContext>
  }
  GlobalRunning?: {
    setCurrent(runningApi: IRunningContext | null): void
    getCurrent(): IRunningContext | null
  }
} = {}

type IPlugins = typeof plugins

type TPluginKey = keyof IPlugins

export function getPlugin<T extends TPluginKey>(k: T) {
  const plugin = plugins[k]
  if (!plugin) {
    throw new Error(`[getPlugin] name=${k} is not found`)
  }
  return plugin as Exclude<IPlugins[T], undefined>
}

export function loadPlugin<T extends TPluginKey>(k: T, p: IPlugins[T]) {
  plugins[k] = p
}
