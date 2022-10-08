import {
  calculateDiff,
  IPatch,
  isFunc,
  map,
  IHookContext,
  isDef,
  likeObject,
  isPromise,
  nextTick,
  calculateChangedPath,
  isEqual,
  TPath,
  shallowCopy,
  log,
  Driver,
  checkQueryWhere,
  isPrimtive,
  last,
  getDeps,
  cloneDeep,
  THookDeps,
  isGenerator,
  runGenerator,
  makeBatchCallback,
  isUndef,
  getName,
  getNames,
  THookNames,
  IModelPatchRecord,
  IModelPatch,
  IDataPatch,
  isDataPatch,
  isModelPatch,
  shortValue,
  getRelatedIndexes,
  getShallowRelatedIndexes,
  getShallowDependentPrevNodes,
  constructDataGraph,
  IModelPatchCreate,
  IModelPatchUpdate,
  IModelPatchRemove,
  get,
  getNamespace
} from './util'
import EventEmitter from 'eventemitter3'
import * as immer from 'immer'
import type { Draft } from 'immer'
import {
  getPlugin,
  IModelCreateData,
  IModelData,
  IModelQuery,
  TCacheFrom
} from './plugin'

const { produceWithPatches, enablePatches, applyPatches } = immer

enablePatches()

export function freeze(target: { _hook?: { freezed?: boolean } }) {
  if (target._hook) {
    target._hook.freezed = true
  }
}
function unFreeze(target: { _hook?: { freezed?: boolean } }) {
  if (target._hook) {
    target._hook.freezed = false
  }
}
function checkFreeze(target: { _hook?: { freezed?: boolean } }) {
  return target._hook?.freezed === true
}

interface ITarget<T> {
  watcher: Watcher<T>
  notify: (hook?: T, patches?: IPatch[], rc?: ReactiveChain) => void
}

interface ISource<U> {
  watchers: Set<Watcher<U>>
  addWatcher: (w: Watcher<U>) => void
}

export class Watcher<T = Hook> {
  deps: Map<ISource<T>, (string | number)[][]> = new Map()
  constructor(public target: ITarget<ISource<T>>) {}
  notify(
    dep: ISource<T>,
    path: TPath,
    patches?: IPatch[],
    reactiveChain?: ReactiveChain
  ) {
    const paths = this.deps.get(dep)
    const matched = paths?.some(p => isEqual(p, path))
    if (matched) {
      this.target.notify(dep, patches, reactiveChain)
      return true
    }
  }
  addDep(dep: ISource<T>, path: (number | string)[] = []) {
    dep.addWatcher(this)
    if (path.length === 0) {
      path = ['']
    }
    let paths = this.deps.get(dep)
    if (paths) {
      const exist = paths.find(p => p === path || isEqual(p, path))
      if (!exist) {
        paths.push(path)
      }
    } else {
      paths = [path]
      this.deps.set(dep, [path])
    }
    return () => {
      const paths = this.deps.get(dep)
      const existIndex = paths?.findIndex(p => isEqual(p, path))
      if (paths && existIndex && existIndex > -1) {
        paths?.splice(existIndex, 1)
      }
    }
  }
}

export class Hook extends EventEmitter {
  /** hook's name for debugging */
  name?: string
  freezed?: boolean
  watchers = new Set<Watcher<typeof this>>()
  addWatcher(w: Watcher<Hook>) {
    this.watchers.add(w)
  }
}
export function isState(h: { _hook?: State }) {
  return h && (h._hook ? h._hook instanceof State : h instanceof State)
}

enum EHookEvents {
  change = 'change',
  beforeCalling = 'beforeCalling',
  afterCalling = 'afterCalling'
}

function getValueSilently(s: State) {
  return s._internalValue
}

export class State<T = any> extends Hook {
  _internalValue: T
  freezed?: boolean
  modifiedTimstamp = Date.now()
  inputComputePatchesMap: Map<InputCompute, [T, IPatch[]]> = new Map()
  constructor(data: T, public scope?: CurrentRunnerScope) {
    super()
    this._internalValue = data
  }
  trigger(
    path: (number | string)[] = [''],
    patches?: IPatch[],
    reactiveChain?: ReactiveChain<T>,
    triggeredSet?: Set<Watcher>
  ) {
    if (!path || path.length === 0) {
      path = ['']
    }
    if (!triggeredSet) {
      triggeredSet = new Set()
    }
    this.watchers.forEach(w => {
      if (triggeredSet?.has(w)) {
        return
      }
      if (w.notify(this, path, patches, reactiveChain)) {
        triggeredSet?.add(w)
      }
    })
    return triggeredSet
  }
  get value(): T {
    if (currentInputeCompute) {
      return this.getInputComputeDraftValue()
    }
    return internalProxy(this, this._internalValue)
  }
  update(
    v: T,
    patches?: IDataPatch[],
    silent?: boolean,
    reactiveChain?: ReactiveChain<T>
  ) {
    const oldValue = this._internalValue
    this._internalValue = v
    const shouldTrigger = oldValue !== v && !isEqual(oldValue, v)
    if (shouldTrigger) {
      this.modifiedTimstamp = Date.now()
      this.emit(EHookEvents.change, this)
    }
    reactiveChain?.update()

    if (silent) {
      return
    }

    // trigger only changed
    if (shouldTrigger) {
      const triggeredSet = this.trigger(undefined, undefined, reactiveChain)

      if (patches && patches.length > 0) {
        const changedPathArr = calculateChangedPath(oldValue, patches)
        changedPathArr
          .filter(p => p.length !== 0)
          .forEach(path =>
            this.trigger(path, patches, reactiveChain, triggeredSet)
          )
      }
    }
  }
  applyComputePatches(ic: InputCompute, reactiveChain?: ReactiveChain<T>) {
    let exist = this.inputComputePatchesMap.get(ic)
    if (exist) {
      this.inputComputePatchesMap.delete(ic)
      this.update(
        exist[0],
        exist[1]?.filter(isDataPatch) as IDataPatch[],
        false,
        reactiveChain
      )
    }
  }
  getInputComputeDraftValue(): T {
    let exist = this.inputComputePatchesMap.get(currentInputeCompute!)
    if (exist) {
      return exist[0]
    } else {
      if (isPrimtive(this._internalValue)) {
        return this._internalValue
      }
      return shallowCopy(this._internalValue)
    }
  }
  addComputePatches(value: T, patches: IPatch[]) {
    if (currentInputeCompute) {
      let exist = this.inputComputePatchesMap.get(currentInputeCompute)
      if (!exist) {
        exist = [value, []]
      }
      exist[0] = value
      /**
       * @TODO：need merging patches
       */
      exist[1] = exist[1].concat(patches)
      this.inputComputePatchesMap.set(currentInputeCompute, exist)
    } else {
      throw new Error(
        '[Model.addComputePatches] must invoked under a InputCompute'
      )
    }
  }
}
type PartialGetter<T> = {
  [K in keyof T]?: T[K]
}

type TGetterData<T> = () => PartialGetter<T>

interface AsyncHook<T> {
  init: boolean
  getterPromise: Promise<T> | null
  startAsyncGetter: () => { end: () => void; valid: () => boolean }
  pending: boolean
}

class AsyncState<T> extends State<T> implements AsyncHook<T> {
  init = true
  getterPromise: Promise<T> | null = null
  asyncCount = 0
  startAsyncGetter() {
    this.asyncCount++
    const currentCount = this.asyncCount
    this.init = false
    let resolve: Function
    this.getterPromise = new Promise(r => (resolve = r))

    return {
      end: () => {
        resolve()
        this.getterPromise = null
      },
      valid: () => {
        return this.asyncCount <= currentCount
      }
    }
  }
  get pending() {
    return !!this.getterPromise
  }
}

export const writeInitialSymbol = Symbol.for('@@writePrismaInitial')

export abstract class Model<T extends any[]> extends AsyncState<T[]> {
  queryWhereComputed: Computed<IModelQuery['query'] | void> | null = null
  watcher: Watcher = new Watcher(this)
  entity: string
  constructor(
    entity: string,
    getter: (() => IModelQuery['query'] | undefined) | undefined = undefined,
    public options: IModelOption = {},
    public scope: CurrentRunnerScope
  ) {
    super([], scope)

    this.entity = scope.getRealEntityName(entity)

    if (!getter) {
      getter = () => ({})
    }
    this.queryWhereComputed = new Computed(getter!, scope)
    this.watcher.addDep(this.queryWhereComputed)

    // default to immediate
    if (options.immediate || options.immediate === undefined) {
      // do query after driver ready
      scope.effect((reactiveChain?: ReactiveChain) => {
        this.queryWhereComputed.name = `${this.name}.query`

        const newReactiveChain: ReactiveChain<T> | undefined =
          reactiveChain?.add(this)
        this.query(newReactiveChain)
      })
    }
  }

  setGetter(fn: () => IModelQuery['query'] | undefined) {
    this.queryWhereComputed.getter = fn
  }

  notify(h?: Hook, p?: IPatch[], reactiveChain?: ReactiveChain) {
    log(`[${this.constructor.name}.executeQuery] withChain=${!!reactiveChain}`)
    const newReactiveChain = reactiveChain?.addNotify(this)
    this.executeQuery(newReactiveChain)
  }
  async getQueryWhere(
    reactiveChain?: ReactiveChain
  ): Promise<IModelQuery['query'] | void> {
    if (this.queryWhereComputed.getterPromise) {
      await this.queryWhereComputed!.getterPromise
    }

    const queryWhereValue = ReactiveChain.withChain(reactiveChain, () => {
      return this.queryWhereComputed!.value
    })

    if (queryWhereValue) {
      if (queryWhereValue === ComputedInitialSymbol) {
        // queryWhereComputed hadnt run.
        this.query()
      } else {
        return queryWhereValue as IModelQuery['query']
      }
    }
  }
  override get value(): T[] {
    if (this.init) {
      this.query(currentReactiveChain)
    }
    return super.value
  }
  async ready() {
    if (this.getterPromise) {
      await this.getterPromise
    }
  }
  query(reactiveChain?: ReactiveChain) {
    log(`[${this.constructor.name}.query]`)

    if (!reactiveChain) {
      reactiveChain = currentReactiveChain
    }

    if (this.queryWhereComputed) {
      this.queryWhereComputed.tryModify(reactiveChain)
    }
  }
  async enableQuery() {
    const q = await this.getQueryWhere()
    const valid = q && checkQueryWhere(q)
    return !!q
  }
  abstract executeQuery(reactiveChain?: ReactiveChain): Promise<void>
  abstract exist(obj: Partial<T[0]>): Promise<T | undefined>
  abstract refresh(): Promise<void>
  abstract checkAndRefresh(): Promise<void>
  override async applyComputePatches(
    ic: InputCompute,
    reactiveChain?: ReactiveChain
  ) {
    const exist = this.inputComputePatchesMap.get(ic)
    if (exist) {
      this.inputComputePatchesMap.delete(ic)
      const patches = exist[1].filter(isDataPatch) as IDataPatch[]
      const newValue = applyPatches(this._internalValue, patches)
      await this.updateWithPatches(newValue, patches, false, reactiveChain)
    }
  }

  abstract updateWithPatches(
    v: T[],
    patches: IPatch[],
    silent: boolean,
    reactiveChain?: ReactiveChain
  ): Promise<void>
}
export abstract class WriteModel<T extends Object> extends AsyncState<
  T | Symbol
> {
  abstract identifier: string
  entity: string = ''
  sourceModel?: Model<T[]>

  extraGetters: Array<(() => T) | undefined> = []

  constructor(
    public sourceModelGetter: { _hook: Model<T[]> } | string,
    public basicGetData: (() => T) | undefined,
    scope: CurrentRunnerScope
  ) {
    super(writeInitialSymbol, scope)

    if (!basicGetData) {
      this.setGetter(() => ({} as T))
    }

    if (typeof sourceModelGetter !== 'string') {
      this.sourceModel = sourceModelGetter._hook
      this.entity = sourceModelGetter._hook.entity
    } else {
      this.entity = sourceModelGetter
    }
    this.entity = scope.getRealEntityName(this.entity)
  }
  refresh (): Promise<void> {
    return this.sourceModel?.refresh()
  }
  injectGetter(fn: () => T) {
    this.extraGetters.push(fn)
  }
  getData (): T {
    const base = this.basicGetData()
    // iterate array from tail to head
    for (let i = this.extraGetters.length - 1; i >= 0; i--) {
      const fn = this.extraGetters[i]
      if (fn) {
        const data = fn()
        Object.assign(base, data)
      }
    }
    return base
  }
  setGetter(fn: () => T) {
    this.basicGetData = fn
  }
  abstract createRow(obj?: Partial<T>): Promise<void>
  abstract updateRow(where: number, obj?: { [k: string]: any }): Promise<void>
  abstract removeRow(where: number): Promise<void>
  abstract executeModelPath(ps: IModelPatch[]): Promise<void>
  override async applyComputePatches(
    ic: InputCompute,
    reactiveChain?: ReactiveChain
  ) {
    const exist = this.inputComputePatchesMap.get(ic)
    if (exist) {
      this.inputComputePatchesMap.delete(ic)
      const patches = exist[1].filter(isModelPatch) as IModelPatch[]
      const { end, valid } = this.startAsyncGetter()

      await this.executeModelPath(patches)
      if (!valid()) {
        return
      }

      this.scope.modelPatchEvents.pushPatch(this, patches)
      // TIP: must refresh after patch recording to make sure the modified time of model > patch time

      log('[WriteModel.applyComputePatches]', 'execute patches done')

      await this.refresh()

      log('[WriteModel.applyComputePatches]', 'sourceModel refresh done')

      reactiveChain?.update()

      end()
    }
  }
}
/** TIP: code for example */
export abstract class ClientModel<T extends any[]> extends Model<T> {}
/** TIP: code for example */
export abstract class ClientWriteModel<T> extends WriteModel<T> {}

/**
 * @TODO here shouldn't use "string" type as searching index.that bring too much dynamism
 */
interface IPatchCreate {
  type: 'create'
  parameter: IModelCreateData
}
interface IPatchUpdate {
  type: 'update'
  parameter: IModelData
}
interface IPatchRemove {
  type: 'remove'
  parameter: Omit<IModelData, 'data'>
}

/**
 * only used in writing data to model entity
 */
export const writePrismaInitialSymbol = Symbol.for('@@writePrismaInitial')

export class Prisma<T extends any[]> extends Model<T> {
  identifier = 'prisma'
  async executeQuery(reactiveChain?: ReactiveChain) {
    const { end, valid } = this.startAsyncGetter()
    try {
      // @TODO：要确保时序，得阻止旧的query数据更新
      const q = await this.getQueryWhere(reactiveChain)
      if (!valid()) {
        return
      }

      log(
        `[${this.name || ''} Model.executeQuery] 1 q.entity, q.query: `,
        this.entity,
        q
      )
      let result: T[] = []
      if (!!q) {
        if (valid()) {
          result = await getPlugin('Model').find(
            this.identifier,
            this.entity,
            q
          )
          log(`[${this.name || ''} Model.executeQuery] 2 result: `, result)
        }
      }
      if (valid()) {
        this.update(result, [], false, reactiveChain)
      }
    } catch (e) {
      log(`[${this.name || ''} Model.executeQuery] error`)
      console.error(e)
    } finally {
      log(`[${this.name || ''} Model.executeQuery] end`)
      if (valid()) {
        end()
      }
    }
  }
  async exist(obj: Partial<T[0]>) {
    const result: T[] = await getPlugin('Model').find(
      this.identifier,
      this.entity,
      { where: obj }
    )
    return result[0]
  }
  async refresh() {
    await this.executeQuery(currentReactiveChain?.add(this))
  }
  async updateWithPatches(
    v: T[],
    patches: IDataPatch[],
    silent: boolean,
    reactiveChain?: ReactiveChain
  ) {
    const oldValue = this._internalValue
    if (!this.options.pessimisticUpdate) {
      log('[Model.updateWithPatches] update internal v=', v)
      this.update(v, patches, silent, reactiveChain)
    }

    const { end } = this.startAsyncGetter()

    const { entity } = this
    try {
      const diff = calculateDiff(oldValue, patches)
      log('[Model.updateWithPatches] diff: ', diff)
      await getPlugin('Model').executeDiff(this.identifier, entity, diff)
    } catch (e) {
      console.info('[updateWithPatches] postPatches fail', e)
      // @TODO autoRollback value
      // if (this.options.autoRollback) {
      //   this.update(oldValue, [], true)
      // }
    } finally {
      end()
    }
    await this.executeQuery(reactiveChain)
  }
  async checkAndRefresh() {
    // no need in server
  }
}

export class WritePrisma<T> extends WriteModel<T> {
  identifier = 'prisma'
  async executeModelPath(ps: IModelPatch[]) {
    const { applyComputeParalle } = this.scope

    const opMap: Record<
      IModelPatch['op'],
      (p: IModelPatch) => Promise<void | number[]>
    > = {
      create: (p: IModelPatchCreate) =>
        getPlugin('Model').create(this.identifier, this.entity, p.value),
      update: (p: IModelPatchUpdate) =>
        getPlugin('Model').update(this.identifier, this.entity, p.value),
      remove: (p: IModelPatchRemove) =>
        getPlugin('Model').remove(this.identifier, this.entity, p.value)
    }

    let promiseArr: Promise<any>[] = []
    for (const p of ps) {
      currentReactiveChain?.addCall(this, p.op)
      const r = opMap[p.op](p)
      if (applyComputeParalle) {
        promiseArr.push(r)
      } else {
        await r
      }
    }
    if (promiseArr.length > 0) {
      await Promise.all(promiseArr)
    }
  }
  async createRow(obj?: Partial<T>, include?: { [k in keyof T]: boolean }) {
    log('[WritePrisma.createRow]')
    const defaults = this.getData()

    if (currentInputeCompute) {
      const d: T = Object.assign(defaults, obj)
      this.addComputePatches(undefined, [
        {
          op: 'create',
          value: {
            data: d,
            include
          }
        }
      ])
    } else {
      throw new Error('[WritePrisma] must invoke "createRow" in a InputCompute')
    }
  }
  async updateRow(where: number, obj?: { [k: string]: any }) {
    log('[WritePrisma.updateRow]')
    if (currentInputeCompute) {
      const defaults = this.getData()
      const d: T = Object.assign(defaults, obj)
      this.addComputePatches(undefined, [
        {
          op: 'update',
          value: {
            where: { id: where },
            data: d
          }
        }
      ])
    } else {
      throw new Error('[WritePrisma] must invoke "updateRow" in a InputCompute')
    }
  }
  async removeRow(where?: number) {
    log('[WritePrisma.removeRow]')
    if (currentInputeCompute) {
      const defaults = this.getData()
      this.addComputePatches(undefined, [
        {
          op: 'remove',
          value: {
            where: { id: where || (defaults as any)?.id }
          }
        }
      ])
    } else {
      throw new Error('[WritePrisma] must invoke "updateRow" in a InputCompute')
    }
  }
}

export class ClientPrisma<T extends any[]> extends Prisma<T> {
  override async executeQuery() {
    const { end } = this.startAsyncGetter()

    const valid = await this.enableQuery()

    log(
      `[ClientModel.executeQuery] valid=${valid} ignoreClientEnable=${this.options.ignoreClientEnable}`
    )

    // @TODO: ignoreClientEnable will useless
    if (valid || this.options.ignoreClientEnable) {
      const context = this.scope.createActionContext(this)
      log('[ClientModel.executeQuery] before post')
      const result: IHookContext = await getPlugin('Context').postQueryToServer(
        context
      )

      const index = this.scope.hooks.indexOf(this)
      if (result.data) {
        const d = result.data[index]
        if (d.length >= 2) {
          this.update(d[1])
        }
      }
    }

    end()
  }
  override async updateWithPatches() {
    throw new Error('[ClientPrisma] cant update in client')
  }
  override async checkAndRefresh() {
    const { modifiedTimstamp } = this
    const patchEvent = this.scope.modelPatchEvents.getRecord(this)
    if (
      patchEvent &&
      patchEvent.some(obj => {
        return obj.timing > modifiedTimstamp
      })
    ) {
      this.refresh()
    }
  }
}
/**
 * writePrisma in client will record the changing
 */
export class ClientWritePrisma<T> extends WritePrisma<T> {
  override async createRow(obj?: Partial<T>): Promise<void> {
    throw new Error(
      '[ClientWritePrisma] cant invoke "create" directly in client'
    )
  }
  override async updateRow(
    whereId: number,
    obj?: { [k: string]: any }
  ): Promise<void> {
    throw new Error(
      '[ClientWritePrisma] cant invoke "update" directly in client'
    )
  }
  override async removeRow(whereId: number): Promise<void> {
    throw new Error(
      '[ClientWritePrisma] cant invoke "remove" directly in client'
    )
  }
}

export interface ICacheOptions<T> {
  source?: { _hook: State<T> }
  defaultValue?: T
  from: TCacheFrom
}
export const CacheInitialSymbol = Symbol('@@CacheInitialSymbol')
export class Cache<T> extends AsyncState<T | Symbol> {
  getterKey: string
  watcher: Watcher = new Watcher(this)
  source: State<T> | undefined
  getterPromise: Promise<any> | null = null

  constructor(
    key: string,
    public options: ICacheOptions<T>,
    public scope: CurrentRunnerScope
  ) {
    super(CacheInitialSymbol, scope)
    this.getterKey = key // `tarat_cache_${scope.hookRunnerName}__${key}`

    if (this.options.source) {
      this.source = this.options.source._hook
      this.watcher.addDep(this.source)

      const { _internalValue } = this.source
      const initVal = isPrimtive(_internalValue)
        ? _internalValue
        : shallowCopy(_internalValue)
      super.update(initVal)
    }
  }
  notify(hook?: Hook, p?: IPatch[], reactiveChain?: ReactiveChain) {
    const { from } = this.options
    const { source } = this

    if (hook && source && hook === source) {
      log('[Cache.notify] source changed')
      // not calling update prevent notify the watcher for current cache
      this._internalValue = CacheInitialSymbol
      /**
       * just clear value in cache not update directly
       * reason 1: for lazy
       * reason 2: prevent writing conflict while coccurent writing at same time
       */
      getPlugin('Cache').clearValue(this.scope, this.getterKey, from)

      const newReactiveChain = reactiveChain?.addNotify(this)
      this.executeQuery(newReactiveChain)
    }
  }
  override get value(): T | Symbol {
    /** @TODO should use symbol for initial value */
    if (this._internalValue === CacheInitialSymbol) {
      this.executeQuery(currentReactiveChain)
    }
    const v = super.value
    return v === CacheInitialSymbol ? undefined : v
  }
  async executeQuery(reactiveChain?: ReactiveChain) {
    const { from } = this.options
    const { source } = this

    const { end, valid } = this.startAsyncGetter()

    try {
      const valueInCache = await getPlugin('Cache').getValue<T>(
        this.scope,
        this.getterKey,
        from
      )
      if (!valid()) {
        return
      }
      log(`[${this.name || ''} Cache.executeQuery] valueInCache=`, valueInCache)
      if (valueInCache !== undefined) {
        super.update(valueInCache, [], false, reactiveChain)
      } else if (source) {
        const valueInSource = source.value

        super.update(valueInSource, [], false, reactiveChain)
        // unconcern the result of remote updateing
        getPlugin('Cache').setValue(
          this.scope,
          this.getterKey,
          valueInSource,
          from
        )
      }
    } catch (e) {
      log(`[Cache.executeQuery] error`)
      console.error(e)
    } finally {
      log(`[${this.name || ''} Cache.executeQuery]`)
      if (valid()) {
        end()
      }
    }
  }
  /**
   * call by outer
   * @param v new value
   * @param patches new value with patches
   * @param silent update value wont notify watcher
   * @param reactiveChain
   */
  override async update(
    v?: T | Symbol,
    patches?: IPatch[],

    silent?: boolean,
    reactiveChain?: ReactiveChain
  ) {
    const { from } = this.options
    const { source } = this
    if (source) {
      throw new Error(
        '[Cache] can not update value directly while the cache has "source" in options '
      )
    } else {
      super.update(
        v,
        patches?.filter(isDataPatch) as IDataPatch[],
        silent,
        reactiveChain
      )
      await getPlugin('Cache').setValue(this.scope, this.getterKey, v, from)

      log(`[${this.name} cache.update] end k=${this.getterKey} v=${v}`)
    }
  }
}

let currentComputedStack: Computed<any>[] = []

/**
 * check if running inside a computed
 */
function underComputed() {
  return currentComputedStack.length > 0
}

function pushComputed(c: Computed<any>) {
  currentComputedStack.push(c)
}
function popComputed() {
  currentComputedStack.pop()
}

export function setCurrentComputed(c: Computed<any>[]) {
  currentComputedStack = c
}

export const ComputedInitialSymbol = Symbol('@@ComputedInitialSymbol')
export class Computed<T> extends AsyncState<T | Symbol> {
  batchRunCancel: () => void = () => {}
  watcher: Watcher<State<any>> = new Watcher<State<any>>(this)
  // @TODO: maybe here need trigger async optional setting
  constructor(
    public getter:
      | FComputedFunc<T | Symbol>
      | FComputedFuncAsync<T | Symbol>
      | FComputedFuncGenerator<T | Symbol>,
    scope?: CurrentRunnerScope
  ) {
    super(ComputedInitialSymbol, scope)
  }

  override get value(): T | Symbol {
    const callChain = currentReactiveChain?.addCall(this)
    if (this._internalValue === ComputedInitialSymbol) {
      this.tryModify(callChain)
    }
    const v = super.value
    return v === ComputedInitialSymbol ? undefined : v
  }

  run(innerReactiveChain?: ReactiveChain) {
    pushComputed(this)

    type ComputedReturnType = T | Symbol
    // making sure the hook called by computed can register thier chain
    const r:
      | ComputedReturnType
      | Promise<ComputedReturnType>
      | Generator<unknown, ComputedReturnType> = ReactiveChain.withChain(
      innerReactiveChain,
      () => {
        return this.getter(this._internalValue)
      }
    )

    popComputed()
    if (isPromise(r)) {
      const { end, valid } = this.startAsyncGetter()
      ;(r as unknown as Promise<ComputedReturnType>).then(
        (asyncResult: ComputedReturnType) => {
          if (valid()) {
            this.update(asyncResult, [], false, innerReactiveChain)
            end()
          }
        }
      )
    } else if (isGenerator(r)) {
      const { end, valid } = this.startAsyncGetter()
      ;(
        runGenerator(
          r as Generator,
          () => pushComputed(this),
          () => popComputed()
        ) as unknown as Promise<ComputedReturnType>
      ).then((asyncResult: ComputedReturnType) => {
        if (valid()) {
          this.update(asyncResult, [], false, innerReactiveChain)
          end()
        }
      })
    } else {
      this.update(
        r as unknown as ComputedReturnType,
        [],
        false,
        innerReactiveChain
      )
      /** @TODO this code need consider again.maybe need re-design */
      this.init = false
    }
  }
  tryModify(reactiveChain?: ReactiveChain) {
    this.run(reactiveChain?.add(this))
  }
  notify(h?: Hook, p?: IPatch[], reactiveChain?: ReactiveChain) {
    /**
     * trigger synchronism
     */
    this.run(reactiveChain?.addNotify(this))
  }
}

export class ClientComputed<T> extends Computed<T> {
  override run() {
    const { end, valid } = this.startAsyncGetter()
    const context = this.scope.createActionContext(this)
    log('[ComputedInServer.run] before post')
    getPlugin('Context')
      .postComputeToServer(context)
      .then((result: IHookContext) => {
        if (valid()) {
          const index = this.scope.hooks.indexOf(this)
          if (result.data) {
            const d = result.data[index]
            if (d.length >= 2) {
              this.update(d[1])
            }
          }
          end()
        }
      })
  }
}

/**
 * control global InputCompute while running
 */
let currentInputeCompute: InputCompute | null = null
const inputComputeStack: InputCompute[] = []

function pushInputComputeStack(ic: InputCompute) {
  inputComputeStack.push(ic)
  currentInputeCompute = ic
}
function popInputComputeStack() {
  currentInputeCompute = inputComputeStack[inputComputeStack.length - 2]
  return inputComputeStack.pop()
}

export class InputCompute<P extends any[] = any> extends Hook {
  commitPromise: Promise<void> | null = null
  constructor(
    public getter:
      | InputComputeFn<P>
      | AsyncInputComputeFn<P>
      | GeneratorInputComputeFn<P>,
    /** @TODO should not couple the "scope" */
    public scope: CurrentRunnerScope
  ) {
    super()
  }
  inputFuncStart() {}
  commitComputePatches(
    reactiveChain?: ReactiveChain
  ): (void | Promise<void>)[] | undefined {
    if (this.commitPromise) {
      this.commitPromise = this.commitPromise.then(() => {
        const r = this.scope.applyAllComputePatches(this, reactiveChain)
        if (r?.some(p => isPromise(p))) {
          return Promise.all(r).then()
        }
      })
      return [this.commitPromise]
    }
    const r = this.scope.applyAllComputePatches(this, reactiveChain)
    if (r?.some(p => isPromise(p))) {
      this.commitPromise = Promise.all(r).then()
    }
    return r
  }
  inputFuncEnd(reactiveChain?: ReactiveChain): Promise<void> {
    const r = this.commitComputePatches(reactiveChain)
    unFreeze({ _hook: this })
    this.emit(EHookEvents.afterCalling, this)

    if (r?.some(p => isPromise(p))) {
      return Promise.all(r).then(r => {
        this.commitPromise = null
      })
    }
    return Promise.resolve()
  }

  async run(...args: any): Promise<void> {
    this.emit(EHookEvents.beforeCalling, this)
    const isFreeze = checkFreeze({ _hook: this })
    if (isFreeze) {
      return
    }

    // confirm：the composed inputCompute still running under the parent inputCompute
    // if (!currentInputeCompute) {
    //   currentInputeCompute = this
    // }

    // means that current IC is nested in other IC.
    if (currentInputeCompute) {
      const r = currentInputeCompute.commitComputePatches(currentReactiveChain)
      if (r?.some(p => isPromise(p))) {
        await Promise.all(r)
      }
    }

    pushInputComputeStack(this)

    const newReactiveChain = currentReactiveChain?.addCall(this)
    const funcResult = ReactiveChain.withChain(newReactiveChain, () => {
      return this.getter(...args)
    })

    popInputComputeStack()

    // if (currentInputeCompute === this) {
    //   currentInputeCompute = null
    // }

    log(
      '[InputCompute.run]',
      `isGen=${isGenerator(funcResult)}`,
      `isP=${isPromise(funcResult)}`
    )
    // use generator
    if (isGenerator(funcResult)) {
      let generatorPreservedCurrentReactiveChain: ReactiveChain | undefined
      await runGenerator(
        funcResult as Generator<void>,
        // enter: start/resume
        () => {
          // if (!currentInputeCompute) {
          //   currentInputeCompute = this
          // }
          pushInputComputeStack(this)

          generatorPreservedCurrentReactiveChain = currentReactiveChain
          currentReactiveChain = newReactiveChain
        },
        // leave: stop/suspend
        () => {
          // tip: inputCompute supporting nestly compose other inputCompute
          // if (currentInputeCompute === this) {
          //   currentInputeCompute = null
          // }
          popInputComputeStack()

          currentReactiveChain = generatorPreservedCurrentReactiveChain
        }
      )
      return this.inputFuncEnd(newReactiveChain)
    } else if (isPromise(funcResult)) {
      // end compute context in advance

      await funcResult

      return this.inputFuncEnd(newReactiveChain)
    }
    if (currentInputeCompute === this) {
      currentInputeCompute = null
    }
    return this.inputFuncEnd(newReactiveChain)
  }
}

class AsyncInputCompute<T extends any[]>
  extends InputCompute<T>
  implements AsyncHook<T>
{
  init = true
  getterPromise: Promise<T> | null = null
  asyncCount: number = 0
  startAsyncGetter() {
    this.asyncCount++
    let currentCount = this.asyncCount
    this.init = false
    let resolve: Function
    this.getterPromise = new Promise(r => (resolve = r))

    return {
      end: () => {
        resolve()
        this.getterPromise = null
      },
      valid: () => {
        return this.asyncCount <= currentCount
      }
    }
  }
  get pending(): boolean {
    return !!this.getterPromise
  }
}

class InputComputeInServer<P extends any[]> extends AsyncInputCompute<P> {
  async run(...args: any[]): Promise<void> {
    const { end, valid } = this.startAsyncGetter()

    this.emit(EHookEvents.beforeCalling, this)
    if (!checkFreeze({ _hook: this })) {
      /**
       * only icInServer need confirm all related dependencies ready
       * because IC just be manual (by User or System)
       */
      await this.scope.readyReleated(this)

      currentReactiveChain?.add(this)
      const context = this.scope.createShallowActionContext(this, args)
      const result = await getPlugin('Context').postComputeToServer(context)
      if (valid()) {
        this.scope.applyContextFromServer(result)
      }
    }
    if (valid()) {
      const r = this.inputFuncEnd()
      end()
      return r
    }
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
let currentReactiveChain: ReactiveChain | undefined = undefined
export function startdReactiveChain(name: string = 'root') {
  currentReactiveChain = new ReactiveChain()
  currentReactiveChain.isRoot = true
  currentReactiveChain.name = name
  return currentReactiveChain
}
export function stopReactiveChain() {
  currentReactiveChain = undefined
}
/**
 * collect reactive chain for debug
 */
type ChainTrigger<T> = CurrentRunnerScope<any> | State<T> | InputCompute<any>
export class ReactiveChain<T = any> {
  isRoot = false
  allLeafCount = 0
  order: number = 0
  name?: string
  hookIndex?: number
  hookKey?: string
  oldValue: T | undefined
  newValue: T | undefined
  hasNewValue: boolean = false
  children: ReactiveChain<T>[] = []
  type?: 'update' | 'notify' | 'call'
  constructor(public parent?: ReactiveChain, public hook?: ChainTrigger<T>) {
    this.order = parent?.plusLeaf() || 0

    if (hook instanceof State) {
      this.oldValue = hook._internalValue
    }
  }
  static withChain<T extends (...args: any[]) => any>(
    chain: ReactiveChain,
    fn: T
  ): ReturnType<T> {
    const oldCurrentReactiveChain = currentReactiveChain
    currentReactiveChain = chain

    const r = fn()

    currentReactiveChain = oldCurrentReactiveChain
    return r
  }
  plusLeaf() {
    if (this.isRoot) {
      this.allLeafCount += 1
      return this.allLeafCount
    }
    return this.parent.plusLeaf()
  }
  stop() {
    stopReactiveChain()
  }
  update() {
    if (this.hook instanceof State) {
      this.hasNewValue = true
      this.newValue = this.hook._internalValue
    }
  }
  add(trigger: ChainTrigger<T>, key?: string): ReactiveChain<T> {
    const childChain = new ReactiveChain(this, trigger)
    childChain.hookKey = key
    this.children.push(childChain)

    if (currentRunnerScope) {
      if (trigger instanceof Hook) {
        const index = currentRunnerScope.hooks.indexOf(trigger)
        if (index > -1) {
          childChain.hookIndex = index
        }
      }
    }
    return childChain
  }
  addCall(trigger: ChainTrigger<T>, key?: string): ReactiveChain<T> {
    const childChain = this.add(trigger, key)
    childChain.type = 'call'
    return childChain
  }
  addNotify(trigger: ChainTrigger<T>): ReactiveChain<T> {
    const childChain = this.add(trigger)
    childChain.type = 'notify'
    return childChain
  }
  addUpdate(child: ChainTrigger<T>): ReactiveChain<T> {
    const childChain = this.add(child)
    childChain.type = 'update'
    return childChain
  }
  print() {
    const preLink = '|--> '
    const preDec = '|-- '
    const preHasNextSpace = '|  '
    const preSpace = '   '

    function dfi(current: ReactiveChain) {
      const isRunnerScope = current.hook instanceof CurrentRunnerScope
      let currentName = current.hook?.constructor.name || current.name || ''
      if (isRunnerScope) {
        currentName = `\x1b[32m${currentName}\x1b[0m`
      }
      if (current.hook?.name) {
        currentName = `${currentName}(${current.hook?.name}${
          current.hookKey ? '.' + current.hookKey : ''
        })`
      } else if (isDef(current.hookIndex)) {
        currentName = `${currentName}(${current.hookIndex})`
      }
      if (current.type) {
        currentName = `${current.type}: ${currentName}`
      }
      currentName = `\x1b[32m${current.order}\x1b[0m.${currentName}`

      const currentRows = [currentName]
      if (shortValue(current.oldValue)) {
        currentRows.push(`${preDec}cur=${shortValue(current.oldValue)}`)
      } else {
        currentRows.push(`${preDec}cur=${JSON.stringify(current.oldValue)}`)
      }
      if (current.hasNewValue) {
        if (shortValue(current.newValue)) {
          currentRows.push(`${preDec}new=${shortValue(current.newValue)}`)
        } else {
          currentRows.push(`${preDec}new=${JSON.stringify(current.newValue)}`)
        }
      }

      if (current.children.length > 0) {
        const names = current.children.map(dfi)
        const rows: string[] = []
        names.forEach((arr, i) => {
          arr.forEach((childName, j) => {
            if (j === 0) {
              rows.push(`${preLink}${childName}`)
            } else {
              if (names[i + 1]) {
                rows.push(`${preHasNextSpace}${childName}`)
              } else {
                rows.push(`${preSpace}${childName}`)
              }
            }
          })
        })
        return [...currentRows, ...rows]
      }
      return [...currentRows]
    }
    const logRows = dfi(this)
    // console the chain log
    console.log(logRows.join('\n'))
  }
}

export enum EScopeState {
  init = 'init',
  idle = 'idle',
  pending = 'pending'
}

/**
 * ScopeContext designed for serialization
 */
export class RunnerContext<T extends Driver> {
  // snapshot
  initialArgList: Parameters<T>
  initialData: IHookContext['data'] | null = null

  // action
  triggerHookIndex?: number
  triggerHookName?: string

  patch?: IHookContext['patch']

  withInitialContext: boolean

  constructor(
    public driverName: string,
    public args?: Parameters<T>,
    initialContext?: IHookContext
  ) {
    this.initialArgList = initialContext ? initialContext.initialArgList : args
    this.withInitialContext = !!initialContext
    if (initialContext) {
      this.initialData = initialContext['data']

      this.triggerHookIndex = initialContext.index
      this.triggerHookName = initialContext.indexName

      // args in context has higher priority
      if (initialContext.args) {
        this.args = initialContext.args as any
      }
      if (initialContext.patch) {
        this.patch = initialContext.patch
      }
    }
  }

  serialize(type: 'current' | 'next') {}

  formatContextData(hooks: Hook[], enable?: (i: number) => boolean) {
    const hooksData: IHookContext['data'] = hooks.map((hook, i) => {
      if (hook && (!enable || enable(i))) {
        // means: client -> server, doesn't need model, server must query again
        if (hook instanceof ClientPrisma) {
          return ['clientPrisma']
        }
        if (hook instanceof WritePrisma) {
          return ['writePrisma']
        }
        // means: server -> client
        if (hook instanceof Model) {
          return ['model', getValueSilently(hook), hook.modifiedTimstamp]
        }
        if (hook instanceof Computed) {
          return ['computed', getValueSilently(hook), hook.modifiedTimstamp]
        }
        if (hook instanceof Cache) {
          return ['cache', getValueSilently(hook), hook.modifiedTimstamp]
        }
        if (hook instanceof InputCompute) {
          return ['inputCompute']
        }
        if (hook instanceof State) {
          return ['state', getValueSilently(hook), hook.modifiedTimstamp]
        }
      }
      return ['unserialized']
    })
    return hooksData
  }

  /**
   * need deliver context principles, sort by priority:
   * 1.model/cache(server) needn't
   * 2.state
   * 3.related set/get
   */
  serializeAction(
    hooks: Hook[],
    hookIndex: number,
    args: any[],
    deps: Set<number>
  ): IHookContext {
    const h = hooks[hookIndex]
    const hookName = h?.name || ''
    const noDeps = deps.size === 0

    const hooksData = this.formatContextData(hooks, i => noDeps || deps.has(i))

    return {
      initialArgList: this.initialArgList,
      name: this.driverName,
      data: hooksData,
      index: hookIndex === -1 ? undefined : hookIndex,
      indexName: hookName,
      args: args || []
    }
  }
  serializePatch(hooks: Hook[], modelPatchEvents: ModelEvent): IHookContext {
    const hooksData = this.formatContextData(hooks)
    const p = modelPatchEvents.toArray()
    return {
      initialArgList: this.initialArgList,
      name: this.driverName,
      data: hooksData,
      // index: -1,
      // indexName: '',
      // args: [],
      patch: p
    }
  }

  serializeBase(hooks: Hook[]): IHookContext {
    const hooksData = this.formatContextData(hooks)
    return {
      initialArgList: this.initialArgList,
      name: this.driverName,
      data: hooksData,
      // index: -1,
      // indexName: '',
      // args: [],
      patch: []
    }
  }

  apply(
    hooks: Hook[],
    c: IHookContext,
    needUpdateCallback: (h: State, value: any, timestamp: number) => void
  ) {
    const contextData = c.data
    /** @TODO runContext shouldnt care the update logic */
    contextData.forEach(([type, value, timestamp], index) => {
      if (isDef(value)) {
        const state = hooks[index] as State
        switch (type) {
          case 'unserialized':
            break
          default:
            /**
             * default to keep silent because of deliver total context now
             */
            needUpdateCallback(state, value, timestamp)
            break
        }
      }
    })

    this.patch = c.patch
  }
}

type TModelEntity = string

export class ModelEvent {
  private data = new Map<TModelEntity, IModelPatchRecord[]>()
  listeners: Function[] = []

  subscribe(f: () => void) {
    this.listeners.push(f)
    return () => {
      const i = this.listeners.indexOf(f)
      this.listeners.splice(i, 1)
    }
  }

  from(arr: IHookContext['patch']) {
    this.data.clear()
    arr.forEach(([entity, record]) => {
      this.data.set(entity, record)
    })
    this.listeners.forEach(f => f())
  }
  toArray() {
    const arr: IHookContext['patch'] = []
    this.data.forEach((v, k) => {
      arr.push([k, v])
    })
    return arr
  }

  getRecord(m: { entity: string }) {
    return this.data.get(m.entity)
  }
  pushPatch(m: { entity: string }, p: IModelPatch[]) {
    let record = this.data.get(m.entity)
    if (!record) {
      record = []
      this.data.set(m.entity, record)
    }
    record.push({
      timing: Date.now(),
      patch: p
    })
  }
}

export class CurrentRunnerScope<T extends Driver = any> {
  name?: string
  hooks: (Hook | undefined)[] = []
  composes: Record<string, any>[] = [] // store the compose execute resutl

  outerListeners: Function[] = []
  stateChangeCallbackRunning = false
  stateChangeCallbackCancel = () => {}
  stateChangeWaitHooks: Set<Hook> = new Set<Hook>()
  watcher: Watcher<Hook> = new Watcher(this)
  // static parsed result
  initialHooksSet?: Set<number>

  reactiveChainStack: ReactiveChain[] = []

  /**
   * receive by runner options
   */
  beleiveContext = false
  updateCallbackSync = false
  applyComputeParalle = false
  modelIndexes: IModelIndexesBase | undefined = undefined
  modelIndexesPath: string[] = []

  effectFuncArr: Function[] = []
  disposeFuncArr: Function[] = []

  constructor(
    public runnerContext: RunnerContext<T>,
    public intialContextDeps: THookDeps,
    public intialContextNames: THookNames,
    public modelPatchEvents: ModelEvent
  ) {
    this.initializeHookSet()
    this.disposeFuncArr.push(
      modelPatchEvents.subscribe(() => {
        this.notifyAllModel()
      })
    )
  }
  /**
   * copy context value into scope for updateXXX hook
   */
  initializeHookSet() {
    const { runnerContext } = this
    if (
      runnerContext.triggerHookIndex !== undefined &&
      typeof runnerContext.triggerHookIndex === 'number' &&
      runnerContext.initialData.length > 0
    ) {
      /** @TODO belive deps calculation from client.it's maybe dangerous' */
      const s = new Set<number>([runnerContext.triggerHookIndex])
      runnerContext.initialData.forEach((d, i) => {
        if (d[0] !== 'unserialized') {
          s.add(i)
        }
      })
      this.initialHooksSet = s
    }
  }

  enterComposeDriver(driverNamespace: string) {
    if (!driverNamespace) {
      throw new Error(
        '[CurrentRunnerScope.enterComposeDriver] sub composed driver doesnt have name'
      )
    }
    this.modelIndexesPath.push(driverNamespace)
    return () => {
      this.modelIndexesPath.pop()
    }
  }

  getRealEntityName(entityKey: string) {
    if (this.modelIndexes) {
      const subIndexes = get(this.modelIndexes, this.modelIndexesPath)
      return subIndexes[entityKey] || entityKey
    }
    return entityKey
  }

  setOptions(op: Partial<IRunnerOptions>) {
    Object.assign(this, op)
  }

  effect(f: Function) {
    this.effectFuncArr.push(f)
  }
  flushEffects() {
    if (this.effectFuncArr.length) {
      const reactiveChain = currentReactiveChain?.add(this)
      this.effectFuncArr.forEach(f => f(reactiveChain))
      this.effectFuncArr = []
    }
  }

  /**
   * call the executable hook: Model, InputCompute
   * @TODO the executable hook maybe need a abstract base class
   */
  async callHook(hookIndex: number, args: any[]) {
    log('[Scope.callHook] start')
    const hook = this.hooks[hookIndex]
    if (hook) {
      if (hook instanceof Model) {
      } else if (hook instanceof Computed) {
        currentReactiveChain = currentReactiveChain?.add(this)
        hook.run(currentReactiveChain)
      } else if (hook instanceof InputCompute) {
        currentReactiveChain = currentReactiveChain?.add(this)
        await hook.run(...args)
      }
    }
    log('[Scope.callHook] end')
  }

  /**
   * while enter UI will activate this function
   */
  activate(fn?: Function) {
    this.notifyAllModel()
    this.outerListeners.push(fn)
  }
  deactivate(fn?: Function) {
    this.outerListeners = fn ? this.outerListeners.filter(f => f !== fn) : []
  }

  private notifyAllModel() {
    this.hooks.forEach(h => {
      if (h instanceof Model) {
        h.checkAndRefresh()
      }
    })
  }

  onUpdate(f: Function) {
    this.outerListeners.push(f)
    return () => {
      this.outerListeners = this.outerListeners.filter(_ => _ !== f)
    }
  }
  notifyOuter() {
    this.outerListeners.forEach(f => f())
  }
  notify(s?: Hook) {
    if (this.updateCallbackSync) {
      this.notifyOuter()
    } else {
      this.stateChangeCallbackCancel()
      this.stateChangeCallbackCancel = nextTick(() => {
        this.notifyOuter()
      })
    }
  }

  addHook(v: Hook | undefined) {
    if (v && this.hooks.indexOf(v) !== -1) {
      throw new Error('[scope.addHook] cant add repeat hook')
    }
    this.hooks.push(v)

    if (v) {
      this.watcher.addDep(v)

      // assign name by inject deps
      if (this.intialContextNames) {
        const r = this.intialContextNames.find(
          arr => arr[0] === this.hooks.length - 1
        )
        if (r?.[1]) {
          v.name = r[1]
        }
      }
    }
  }

  applyDepsMap() {
    const deps = this.intialContextDeps
    deps?.forEach(([name, hookIndex, getDeps]) => {
      getDeps.forEach(triggerHookIndex => {
        let triggerHook: Hook | undefined | null

        if (Array.isArray(triggerHookIndex)) {
          const [type, composeIndex, variableName] = triggerHookIndex
          if (type === 'c') {
            const setterGetterFunc: { _hook: Hook } | undefined =
              this.composes[composeIndex]?.[variableName]
            triggerHook = this.hooks.find(h => h === setterGetterFunc?._hook)
          }
          // @TODO: maybe unknow case
        } else {
          triggerHook = this.hooks[triggerHookIndex]
        }
        if (triggerHook) {
          if (
            this.hooks[hookIndex] instanceof Computed
            // this.hooks[hookIndex] instanceof InputCompute
          ) {
            ;(this.hooks[hookIndex] as Computed<any>).watcher.addDep(
              triggerHook
            )
          }
          if (this.hooks[hookIndex] instanceof Model) {
            ;(
              this.hooks[hookIndex] as Model<any>
            ).queryWhereComputed?.watcher.addDep(triggerHook)
          }
        }
      })
    })
  }

  /**
   * offset compose names and current initial names
   */
  appendComposeNames(si: number, names?: THookNames) {
    if (!names) {
      return
    }
    const len = names.length

    const modifiedNames = (this.intialContextNames || []).map(a => {
      const arr: THookNames[0] = cloneDeep(a)
      if (arr[0] >= si) {
        arr[0] += len
      }
      return arr
    })
    const newOffsetNames: THookNames = names.map(a => {
      return [a[0] + si, a[1]]
    })
    this.intialContextNames = modifiedNames.concat(newOffsetNames)
  }

  /**
   * add compose deps to current driver.
   * plus current hook dep index
   */
  appendComposeDeps(si: number, ei: number, deps?: THookDeps) {
    if (!deps) {
      return
    }
    const hooksInComposeSize = ei - si

    const modifiedDeps = (this.intialContextDeps || []).map(a => {
      const arr: THookDeps[0] = cloneDeep(a)

      if (arr[1] >= si) {
        arr[1] += hooksInComposeSize
      }
      if (arr[2]) {
        arr[2] = arr[2].map(v =>
          typeof v === 'number' && v >= si ? v + hooksInComposeSize : v
        )
      }
      if (arr[3]) {
        arr[3] = arr[3].map(v =>
          typeof v === 'number' && v >= si ? v + hooksInComposeSize : v
        )
      }
      return arr
    })
    const newModifiedDeps: THookDeps = deps.map(a => {
      const arr: THookDeps[0] = cloneDeep(a)

      arr[1] += si
      if (arr[2]) {
        arr[2] = arr[2].map(v =>
          typeof v === 'number' ? v + si : [v[0], v[1] + si, v[2]]
        )
      }
      if (arr[3]) {
        arr[3] = arr[3].map(v =>
          typeof v === 'number' ? v + si : [v[0], v[1] + si, v[2]]
        )
      }
      return arr
    })

    this.intialContextDeps = modifiedDeps.concat(newModifiedDeps)
  }

  applyAllComputePatches(
    currentInputCompute: InputCompute,
    reactiveChain?: ReactiveChain
  ): (void | Promise<void>)[] | undefined {
    const { applyComputeParalle, hooks } = this
    const hookModified = hooks.filter(h => {
      if (h && (h as State).inputComputePatchesMap) {
        return (h as State).inputComputePatchesMap.get(currentInputCompute)
      }
    })

    if (hookModified.length) {
      let prevPromise: Promise<void> | null = null

      return hookModified.map(h => {
        /** @TODO here appending new chain maybe in method of their self  */
        const newChildChain = reactiveChain?.addUpdate(h as State)
        if (h instanceof Model || h instanceof WriteModel) {
          if (applyComputeParalle) {
            return h.applyComputePatches(currentInputCompute, newChildChain)
          } else {
            prevPromise = prevPromise
              ? prevPromise.then(() => {
                  return h.applyComputePatches(
                    currentInputCompute,
                    newChildChain
                  )
                })
              : h.applyComputePatches(currentInputCompute, newChildChain)
          }
          return prevPromise
        } else {
          return (h as State).applyComputePatches(
            currentInputCompute,
            newChildChain
          )
        }
      })
    }
  }

  // transform compose deps to number index that will be convinient for next steps
  hookNumberIndexDeps() {
    const hookIndexDeps: THookDeps = this.intialContextDeps.map(
      ([name, hi, getD, setD]) => {
        const [newGetD, newSetD] = [getD, setD].map(dependencies => {
          return dependencies
            ?.map(numOrArr => {
              if (Array.isArray(numOrArr) && numOrArr[0] === 'c') {
                const [_, composeIndex, variableName] = numOrArr
                const setterGetterFunc: { _hook: Hook } | undefined =
                  this.composes[composeIndex]?.[variableName]
                if (setterGetterFunc?._hook) {
                  return this.hooks.indexOf(setterGetterFunc._hook)
                }
              }
              return numOrArr
            })
            .filter(v => v !== undefined)
        })
        return [name, hi, newGetD, newSetD]
      }
    )
    return hookIndexDeps
  }

  /**
   * get all related hook index according to passived hookIndex
   * design logic:
   * 1.getD -> getD -> getD
   * 2.setD in who's getD -> getD
   */
  getRelatedHookIndexes(hookIndex: number): Set<number> {
    if (!this.intialContextDeps) {
      return new Set()
    }

    const hookIndexDeps = this.hookNumberIndexDeps()
    /**
     * for the special performance case:
     * query on any async and client state eg: Client Model, ClientCache, ComputedInServer
     *  that will batch notify all watchers of it and
     *  doing these all operations in single request
     */
    const isModel = this.hooks[hookIndex] instanceof AsyncState
    if (isModel) {
      const indexArr: number[] = []
      hookIndexDeps.forEach(([_, i, get, set]) => {
        if (get.includes(hookIndex)) {
          indexArr.push(i)
        }
      })
      return getRelatedIndexes(indexArr, hookIndexDeps)
    }
    return getRelatedIndexes(hookIndex, hookIndexDeps)
  }
  getShallowRelatedHookIndexes(hookIndex: number): Set<number> {
    if (!this.intialContextDeps) {
      return new Set()
    }
    const hookIndexDeps = this.hookNumberIndexDeps()
    const tailIndexes = getShallowRelatedIndexes(hookIndex, hookIndexDeps)
    return tailIndexes
  }
  getDependenceByModel(indexes: Set<number>) {
    const result = new Set<number>()

    const hookIndexDeps = this.hookNumberIndexDeps()
    const rootNodes = constructDataGraph(hookIndexDeps)

    const task = (currentIndexes: Set<number>) => {
      if (currentIndexes.size <= 0) {
        return
      }

      const modelHookIndexes = new Set<number>()
      currentIndexes.forEach(i => {
        if (this.hooks[i] instanceof Model) {
          modelHookIndexes.add(i)
        }
      })
      if (modelHookIndexes.size > 0) {
        const nextModelIndexes = new Set<number>()
        modelHookIndexes.forEach(i => {
          getShallowDependentPrevNodes(rootNodes, { id: i }).forEach(n => {
            const r = result.has(n.id)
            result.add(n.id)
            if (this.hooks[n.id] instanceof Model && !r) {
              nextModelIndexes.add(n.id)
            }
          })
        })
        task(nextModelIndexes)
      }
    }

    task(indexes)

    return result
  }

  createBaseContext() {
    const { hooks } = this
    return this.runnerContext.serializeBase(hooks)
  }
  getRelatedIndexesByHook(h: Hook, excludeSelf?: boolean) {
    const { hooks } = this
    const hookIndex = h ? hooks.indexOf(h) : -1

    let deps = this.getRelatedHookIndexes(hookIndex)
    if (excludeSelf) {
      deps.delete(hookIndex)
    }
    return deps
  }
  /**
   * as a resonse while receive a input context
   */
  createPatchContext() {
    const { hooks, modelPatchEvents } = this
    return this.runnerContext.serializePatch(hooks, modelPatchEvents)
  }
  /**
   * as a input of other's Runner and trigger
   * need deliver context principles, sort by priority:
   * 1.model/cache(server) needn't
   * 2.state
   * 3.related set/get
   */
  createActionContext(h?: Hook, args?: any[]): IHookContext {
    const { hooks } = this
    const hookIndex = h ? hooks.indexOf(h) : -1

    let deps = new Set<number>()
    if (h) {
      deps = this.getRelatedHookIndexes(hookIndex)
    }

    return this.runnerContext.serializeAction(
      hooks,
      hookIndex,
      args || [],
      deps
    )
  }
  createShallowActionContext(h?: Hook, args?: any[]): IHookContext {
    const { hooks } = this
    const hookIndex = h ? hooks.indexOf(h) : -1

    let deps = new Set<number>()
    if (h) {
      deps = this.getShallowRelatedHookIndexes(hookIndex)
      /** model must need it's shallow dependent */
      if (deps.size > 0) {
        const modelDeps = this.getDependenceByModel(deps)
        modelDeps.forEach(v => {
          deps.add(v)
        })
      }
    }

    return this.runnerContext.serializeAction(
      hooks,
      hookIndex,
      args || [],
      deps
    )
  }
  // alias
  createInputComputeContext(h?: Hook, args?: any[]): IHookContext {
    return this.createActionContext(h, args)
  }
  applyContextFromServer(c: IHookContext) {
    const { hooks } = this

    this.runnerContext.apply(
      hooks,
      c,
      // invoke while the target state is valid for updating
      (state, value, timestamp) => {
        state.update?.(value, [], true)
        if (value && timestamp) {
          state.modifiedTimstamp = timestamp
        }
      }
    )
    if (c.patch) {
      this.modelPatchEvents.from(c.patch)
    }

    this.notify()
  }

  getState() {
    const asyncHooks = this.hooks.filter(
      h => h && Reflect.has(h, 'getterPromise')
    ) as unknown as { getterPromise: Promise<any> | null }[]

    let notReadyHooks = asyncHooks.filter(h => {
      return !!h.getterPromise
    })

    return notReadyHooks.length === 0 ? EScopeState.idle : EScopeState.pending
  }
  readyReleated(h: Hook) {
    const hi = this.getRelatedIndexesByHook(h, true)
    return this.ready(hi)
  }
  ready(specifies?: Set<number>): Promise<void> {
    const asyncHooks = this.hooks.filter(
      (h, i) =>
        (specifies ? specifies.has(i) : true) &&
        ((h && Reflect.has(h, 'getterPromise')) ||
          h instanceof AsyncInputCompute ||
          h instanceof AsyncState)
    ) as unknown as (AsyncInputCompute<any> | AsyncState<any>)[]

    let readyResolve: () => void
    let readyPromise = new Promise<void>(resolve => (readyResolve = resolve))

    let max = asyncHooks.length * 2
    let i = 0
    async function wait() {
      if (i++ > max) {
        throw new Error('[Scope.ready] unexpect loop for ready')
      }
      let notReadyHooks = asyncHooks
        .filter(h => {
          // if (h.getterPromise) {
          //   console.log(h)
          // }
          return !!h.getterPromise
        })
        .map(h => h.getterPromise)
      if (notReadyHooks.length === 0) {
        readyResolve()
      } else {
        await Promise.all(notReadyHooks)
        wait()
      }
    }
    wait()

    return readyPromise
  }
}

let currentRunnerScope: CurrentRunnerScope<Driver> | null = null

export let GlobalModelEvent: ModelEvent | null = null

export function setGlobalModelEvent(me: ModelEvent | null) {
  GlobalModelEvent = me
}

export interface IModelIndexesBase {
  [k: string]: string | IModelIndexesBase
}

export interface IRunnerOptions {
  // scope
  beleiveContext: boolean
  updateCallbackSync?: boolean
  applyComputeParalle?: boolean
  modelIndexes?: IModelIndexesBase
  //
  runnerContext?: Symbol
}

export class Runner<T extends Driver> {
  scope: CurrentRunnerScope<T>
  options: IRunnerOptions = {
    beleiveContext: false,
    updateCallbackSync: false,
    applyComputeParalle: false,
    modelIndexes: undefined
  }
  constructor(public driver: T, options?: IRunnerOptions) {
    Object.assign(this.options, options)
  }

  prepareScope(args?: Parameters<T>, initialContext?: IHookContext) {
    const context = new RunnerContext(
      getName(this.driver),
      args,
      initialContext
    )

    const modelPatchEvents =
      process.env.TARGET === 'server' || !GlobalModelEvent
        ? new ModelEvent()
        : GlobalModelEvent

    const deps = getDeps(this.driver)
    const names = getNames(this.driver)
    const scope = new CurrentRunnerScope<T>(
      context,
      deps,
      names,
      modelPatchEvents
    )
    scope.setOptions(this.options)

    return scope
  }

  executeDriver(scope: CurrentRunnerScope<T>) {
    const { withInitialContext } = scope.runnerContext
    if (withInitialContext) {
      currentHookFactory = updateHookFactory
    }

    currentRunnerScope = scope
    const result: ReturnType<T> = executeDriver(
      this.driver,
      scope.runnerContext.args
    )
    currentRunnerScope = null

    scope.applyDepsMap()
    // do execute effect.maybe from model/cache
    scope.flushEffects()

    currentHookFactory = mountHookFactory

    return result
  }
  /**
   * @TODO need to refact because of this function should both return result and scope
   */
  init(args?: Parameters<T>, initialContext?: IHookContext): ReturnType<T> {
    const scope = this.prepareScope(args, initialContext)

    this.scope = scope

    const result = this.executeDriver(scope)

    return result
  }
  mount(args?: Parameters<T>, initialContext?: IHookContext) {
    return this.init(args, initialContext)
  }
  update(initialContext: IHookContext) {
    return this.init(undefined, initialContext)
  }
  /**
   * @TODO after init method refactor. shouldnt callHook through runner but scope
   */
  callHook(hookIndex: number, args: any[]) {
    return this.scope?.callHook(hookIndex, args)
  }
  // same above
  state() {
    return this.scope.getState()
  }
  // same above
  ready() {
    return this.scope?.ready()
  }
}

function executeDriver(f: Driver, args: any = []) {
  const driverResult = f(...args)

  if (driverResult) {
  }

  return driverResult
}

export function internalProxy<T>(
  source: State<T>,
  _internalValue: T,
  path: (string | number)[] = []
): T {
  if (underComputed()) {
    last(currentComputedStack).watcher.addDep(source, path)
    if (_internalValue && likeObject(_internalValue)) {
      const copyValue = shallowCopy(_internalValue)
      return new Proxy(copyValue as any, {
        get(target, p: string) {
          let value = Reflect.get(target, p)
          if (typeof value === 'function') {
            value = value.bind(target)
          }
          return internalProxy(source, value, path.concat(p))
        }
      })
    }
  }
  return _internalValue
}

type IModifyFunction<T> = (draft: Draft<T>) => void

interface IModelOption {
  immediate?: boolean
  unique?: boolean
  autoRollback?: boolean
  pessimisticUpdate?: boolean
  ignoreClientEnable?: boolean
  // a custom callback to check if the clientModel
  checkRefresh?: (ps: IPatch[]) => boolean
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

export const mountHookFactory = {
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
}
export const updateHookFactory = {
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
}

export const hookFactoryFeatures = {
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
   * "model" & "prisma" maybe still run in client because of their query compute
   */
  // serverOnly: ['inputComputeInServer', 'computedInServer', 'model', 'prisma']
  serverOnly: ['inputComputeInServer', 'computedInServer']
}
/** @TODO need refact code to auto export these hooks */
export const hookFactoryNames = hookFactoryFeatures.all
export const hasSourceHookFactoryNames = hookFactoryFeatures.withSource
export const initiativeComputeHookFactoryNames =
  hookFactoryFeatures.initiativeCompute

export let currentHookFactory: {
  state: typeof mountState
  model: typeof mountPrisma
  prisma: typeof mountPrisma
  writePrisma: typeof mountWritePrisma
  cache: typeof mountCache
  computed: typeof mountComputed
  computedInServer: typeof mountComputedInServer
  inputCompute: typeof mountInputCompute
  inputComputeInServer: typeof mountInputComputeInServer
} = mountHookFactory

function createStateSetterGetterFunc<SV>(s: State<SV>): {
  (): SV
  (paramter: IModifyFunction<SV>): [SV, IPatch[]]
} {
  return (paramter?: any): any => {
    if (paramter) {
      if (isFunc(paramter)) {
        const [result, patches] = produceWithPatches(s.value, paramter)
        if (currentInputeCompute) {
          s.addComputePatches(result, patches)
        } else {
          const reactiveChain: ReactiveChain<SV> | undefined =
            currentReactiveChain?.addUpdate(s)

          const isUnderComputed = underComputed()
          s.update(result, patches, isUnderComputed, reactiveChain)
        }
        return [result, patches]
      } else {
        throw new Error('[change state] pass a function')
      }
    }
    if (currentReactiveChain) {
      return ReactiveChain.withChain(currentReactiveChain.addCall(s), () => {
        return s.value
      })
    }
    return s.value
  }
}

function createModelSetterGetterFunc<T extends any[]>(
  m: Model<T>
): {
  (): T
  (paramter: IModifyFunction<T>): Promise<[T, IPatch[]]>
} {
  return (paramter?: any): any => {
    if (paramter && isFunc(paramter)) {
      const [result, patches] = produceWithPatches<T>(
        shallowCopy(m.value),
        paramter
      )
      log(
        '[model setter] result, patches: ',
        !!currentInputeCompute,
        JSON.stringify(patches, null, 2)
      )

      if (currentInputeCompute) {
        m.addComputePatches(result, patches)
      } else {
        const reactiveChain: ReactiveChain<T> | undefined =
          currentReactiveChain?.addUpdate(m)

        const isUnderComputed = underComputed()
        m.updateWithPatches(result, patches, isUnderComputed, reactiveChain)
      }
      return [result, patches]
    }
    if (currentReactiveChain) {
      return ReactiveChain.withChain(currentReactiveChain.addCall(m), () => {
        return m.value
      })
    }
    return m.value
  }
}

function createCacheSetterGetterFunc<SV>(c: Cache<SV>): {
  (): SV
  (paramter: IModifyFunction<SV>): [SV, IPatch[]]
} {
  return (paramter?: any): any => {
    if (paramter) {
      if (isFunc(paramter)) {
        const [result, patches] = produceWithPatches(c.value, paramter)
        if (currentInputeCompute) {
          c.addComputePatches(result, patches)
        } else {
          const reactiveChain = currentReactiveChain?.addUpdate(c)

          const isUnderComputed = underComputed()
          c.update(result, patches, isUnderComputed, reactiveChain)
        }
        return [result, patches]
      } else {
        throw new Error('[change cache] pass a function')
      }
    }
    if (currentReactiveChain) {
      return ReactiveChain.withChain(currentReactiveChain.addCall(c), () => {
        return c.value
      })
    }
    return c.value
  }
}

function createUnaccessGetter<T>(index: number) {
  const f = () => {
    throw new Error(`[update getter] cant access un initialized hook(${index})`)
  }
  const newF: (() => any) & { _hook: any } = Object.assign(f, {
    _hook: null
  })
  return newF
}
function createUnaccessModelGetter<T extends any[]>(
  index: number,
  entity: string
) {
  const f = (): any => {
    throw new Error(`[update getter] cant access un initialized hook(${index})`)
  }
  const newF: any = Object.assign(f, {
    _hook: { entity },
    exist: () => true,
    create: () => {},
    update: () => {},
    remove: () => {},
    refresh: () => {}
  })
  return newF
}

function updateValidation() {
  const { hooks, initialHooksSet } = currentRunnerScope!
  const currentIndex = hooks.length
  const valid = !initialHooksSet || initialHooksSet.has(currentIndex)

  return {
    valid,
    currentIndex
  }
}

function updateState<T>(initialValue?: T) {
  const { valid, currentIndex } = updateValidation()

  initialValue =
    currentRunnerScope!.runnerContext.initialData![currentIndex]?.[1]
  // undefined means this hook wont needed in this progress
  if (!valid) {
    currentRunnerScope!.addHook(undefined)
    return createUnaccessGetter<T>(currentIndex)
  }
  const timestamp =
    currentRunnerScope!.runnerContext.initialData![currentIndex]?.[2]
  const hook = new State(initialValue, currentRunnerScope)
  if (timestamp) {
    hook.modifiedTimstamp = timestamp
  }

  const setterGetter = createStateSetterGetterFunc(hook)
  currentRunnerScope!.addHook(hook)
  currentReactiveChain?.add(hook)

  const newSetterGetter = Object.assign(setterGetter, {
    _hook: hook
  })

  return newSetterGetter
}

function mountState<T>(initialValue?: T) {
  const hook = new State(initialValue, currentRunnerScope)

  const setterGetter = createStateSetterGetterFunc(hook)
  currentRunnerScope!.addHook(hook)
  currentReactiveChain?.add(hook)

  const newSetterGetter = Object.assign(setterGetter, {
    _hook: hook
  })

  return newSetterGetter
}

function updatePrisma<T extends any[]>(
  e: string,
  q?: () => IModelQuery['query'] | undefined,
  op?: IModelOption
) {
  const { valid, currentIndex } = updateValidation()

  if (!valid) {
    currentRunnerScope!.addHook(undefined)
    return createUnaccessModelGetter<T>(currentIndex, e)
  }
  const inServer = process.env.TARGET === 'server'
  const { beleiveContext } = currentRunnerScope!

  const receiveDataFromContext = beleiveContext || !inServer

  op = Object.assign({}, op, {
    immediate: !receiveDataFromContext
  })

  const hook = inServer
    ? new Prisma<T>(e, q, op, currentRunnerScope!)
    : new ClientPrisma<T>(e, q, op, currentRunnerScope!)

  currentRunnerScope.addHook(hook)
  currentReactiveChain?.add(hook)

  if (receiveDataFromContext) {
    const initialValue: T =
      currentRunnerScope!.runnerContext.initialData![currentIndex]?.[1]
    const timestamp =
      currentRunnerScope!.runnerContext.initialData![currentIndex]?.[2]
    hook.init = false
    hook._internalValue = initialValue || []
    if (timestamp) {
      hook.modifiedTimstamp = timestamp
    }
  }

  const setterGetter = createModelSetterGetterFunc<T>(hook)
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: hook,
    exist: hook.exist.bind(hook) as typeof hook.exist,
    // create: hook.createRow.bind(hook) as typeof hook.createRow,
    // update: hook.updateRow.bind(hook) as typeof hook.updateRow,
    // remove: hook.removeRow.bind(hook) as typeof hook.removeRow,
    refresh: hook.refresh.bind(hook) as typeof hook.refresh
  })

  return newSetterGetter
}
function mountPrisma<T extends any[]>(
  e: string,
  q?: () => IModelQuery['query'] | undefined,
  op?: IModelOption
) {
  const hook =
    process.env.TARGET === 'server'
      ? new Prisma<T>(e, q, op, currentRunnerScope!)
      : new ClientPrisma<T>(e, q, op, currentRunnerScope!)

  currentRunnerScope.addHook(hook)
  currentReactiveChain?.add(hook)

  const setterGetter = createModelSetterGetterFunc<T>(hook)
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: hook,
    exist: hook.exist.bind(hook) as typeof hook.exist,
    refresh: hook.refresh.bind(hook) as typeof hook.refresh
  })

  return newSetterGetter
}
// TIP: "function updateWritePrisma" same as mountWritePrisma
function mountWritePrisma<T>(source: { _hook: Model<T[]> }, q: () => T) {
  const hook =
    process.env.TARGET === 'server'
      ? new WritePrisma(source, q, currentRunnerScope)
      : new ClientWritePrisma(source, q, currentRunnerScope)

  currentRunnerScope!.addHook(hook)
  currentReactiveChain?.add(hook)

  const getter = () => {
    throw new Error('[writePrisma] cant get data from writePrisma')
  }
  const newGetter = Object.assign(getter, {
    _hook: hook,
    create: hook.createRow.bind(hook) as typeof hook.createRow,
    update: hook.updateRow.bind(hook) as typeof hook.updateRow,
    remove: hook.removeRow.bind(hook) as typeof hook.removeRow
  })

  return newGetter
}

function updateCache<T>(key: string, options: ICacheOptions<T>) {
  const { valid, currentIndex } = updateValidation()

  if (!valid) {
    currentRunnerScope!.addHook(undefined)
    return createUnaccessGetter<T>(currentIndex)
  }

  /** @TODO cache maybe should has initial value */
  const hook = new Cache(key, options, currentRunnerScope!)
  currentRunnerScope.addHook(hook)

  const initialValue: T =
    currentRunnerScope!.runnerContext.initialData![currentIndex]?.[1]
  const timestamp =
    currentRunnerScope!.runnerContext.initialData![currentIndex]?.[2]

  if (initialValue !== undefined) {
    hook._internalValue = initialValue
    if (timestamp) {
      hook.modifiedTimstamp = timestamp
    }
  }

  const setterGetter = createCacheSetterGetterFunc(hook)
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: hook
  })
  return newSetterGetter
}
function mountCache<T>(key: string, options: ICacheOptions<T>) {
  const hook = new Cache(key, options, currentRunnerScope!)
  currentRunnerScope.addHook(hook)
  currentReactiveChain?.add(hook)

  const setterGetter = createCacheSetterGetterFunc(hook)
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: hook
  })
  return newSetterGetter
}

function updateComputed<T>(
  fn: FComputedFuncGenerator<T>
): (() => T) & { _hook: Computed<T> }
function updateComputed<T>(
  fn: FComputedFuncAsync<T>
): (() => T) & { _hook: Computed<T> }
function updateComputed<T>(
  fn: FComputedFunc<T>
): (() => T) & { _hook: Computed<T> }
function updateComputed<T>(fn: any): any {
  const { valid, currentIndex } = updateValidation()

  if (!valid) {
    currentRunnerScope!.addHook(undefined)
    return createUnaccessGetter<T>(currentIndex)
  }
  const initialValue: T =
    currentRunnerScope!.runnerContext.initialData![currentIndex]?.[1]
  const timestamp =
    currentRunnerScope!.runnerContext.initialData![currentIndex]?.[2]

  const hook = new Computed<T>(fn, currentRunnerScope)
  currentRunnerScope!.addHook(hook)
  // @TODO: update computed won't trigger
  hook._internalValue = initialValue
  hook.init = false
  if (timestamp) {
    hook.modifiedTimstamp = timestamp
  }

  currentReactiveChain?.add(hook)

  const getter = () => {
    return hook.value
  }
  const newGetter = Object.assign(getter, {
    _hook: hook
  })
  return newGetter
}
function mountComputed<T>(
  fn: FComputedFuncGenerator<T>
): (() => T) & { _hook: Computed<T> }
function mountComputed<T>(
  fn: FComputedFuncAsync<T>
): (() => T) & { _hook: Computed<T> }
function mountComputed<T>(
  fn: FComputedFunc<T>
): (() => T) & { _hook: Computed<T> }
function mountComputed<T>(fn: any): any {
  const hook = new Computed<T>(fn, currentRunnerScope)
  currentRunnerScope!.addHook(hook)

  currentReactiveChain?.add(hook)

  const getter = () => {
    return hook.value
  }
  const newGetter = Object.assign(getter, {
    _hook: hook
  })
  return newGetter
}

function updateComputedInServer<T>(
  fn: FComputedFuncGenerator<T>
): (() => T) & { _hook: Computed<T> }
function updateComputedInServer<T>(
  fn: FComputedFuncAsync<T>
): (() => T) & { _hook: Computed<T> }
function updateComputedInServer<T>(
  fn: FComputedFunc<T>
): (() => T) & { _hook: Computed<T> }
function updateComputedInServer<T>(fn: any): any {
  const { valid, currentIndex } = updateValidation()

  if (!valid) {
    currentRunnerScope!.addHook(undefined)
    return createUnaccessGetter<T>(currentIndex)
  }

  const initialValue: T =
    currentRunnerScope!.runnerContext.initialData![currentIndex]?.[1]
  const timestamp =
    currentRunnerScope!.runnerContext.initialData![currentIndex]?.[2]

  const hook =
    process.env.TARGET === 'server'
      ? new Computed<T>(fn, currentRunnerScope)
      : new ClientComputed<T>(fn, currentRunnerScope)

  currentRunnerScope!.addHook(hook)
  /** @TODO: update computed won't trigger */
  hook._internalValue = initialValue
  hook.init = false
  if (timestamp) {
    hook.modifiedTimstamp = timestamp
  }

  currentReactiveChain?.add(hook)

  const getter = () => {
    return hook.value
  }
  const newGetter = Object.assign(getter, {
    _hook: hook
  })
  return newGetter
}

function mountComputedInServer<T>(
  fn: FComputedFuncGenerator<T>
): (() => T) & { _hook: Computed<T> }
function mountComputedInServer<T>(
  fn: FComputedFuncAsync<T>
): (() => T) & { _hook: Computed<T> }
function mountComputedInServer<T>(
  fn: FComputedFunc<T>
): (() => T) & { _hook: Computed<T> }
function mountComputedInServer<T>(fn: any): any {
  const hook =
    process.env.TARGET === 'server'
      ? new Computed<T>(fn, currentRunnerScope)
      : new ClientComputed<T>(fn, currentRunnerScope)
  currentRunnerScope!.addHook(hook)

  currentReactiveChain?.add(hook)

  const getter = () => {
    return hook.value
  }
  const newGetter = Object.assign(getter, {
    _hook: hook
  })
  return newGetter
}

export function state<T>(initialValue: T): {
  (): T
  (paramter: IModifyFunction<T>): [any, IPatch[]]
} & { _hook: State<T> }
export function state<T = undefined>(): {
  (): T
  (paramter: IModifyFunction<T | undefined>): [any, IPatch[]]
} & { _hook: State<T | undefined> }
export function state(initialValue?: any) {
  if (!currentRunnerScope) {
    throw new Error('[state] must under a tarat runner')
  }
  return currentHookFactory.state(initialValue)
}

export function model<T extends any[]>(
  e: string,
  q?: () => IModelQuery['query'] | undefined,
  op?: IModelOption
) {
  if (!currentRunnerScope) {
    throw new Error('[model] must under a tarat runner')
  }
  return currentHookFactory.prisma<T>(e, q, op)
}
export function writeModel<T>(source: { _hook: Model<T[]> }, q: () => T) {
  if (!currentRunnerScope) {
    throw new Error('[writePrisma] must under a tarat runner')
  }
  return currentHookFactory.writePrisma<T>(source, q)
}

export function prisma<T extends any[]>(
  e: string,
  q?: () => IModelQuery['query'] | undefined,
  op?: IModelOption
) {
  if (!currentRunnerScope) {
    throw new Error('[prisma] must under a tarat runner')
  }
  return currentHookFactory.prisma<T>(e, q, op)
}

export function writePrisma<T>(source: { _hook: Model<T[]> }, q?: () => T) {
  if (!currentRunnerScope) {
    throw new Error('[writePrisma] must under a tarat runner')
  }
  return currentHookFactory.writePrisma<T>(source, q)
}

export function cache<T>(key: string, options: ICacheOptions<T>) {
  if (!currentRunnerScope) {
    throw new Error('[cache] must under a tarat runner')
  }

  return currentHookFactory.cache<T>(key, options)
}

type FComputedFuncGenerator<T> = (prev?: T) => Generator<any, T, unknown>
type FComputedFuncAsync<T> = (prev?: T) => T
type FComputedFunc<T> = (prev?: T) => T

// type PickGeneratorReturnType<T> = T extends

export function computed<T>(
  fn: FComputedFuncGenerator<T>
): (() => T) & { _hook: Computed<T> }
export function computed<T>(
  fn: FComputedFuncAsync<T>
): (() => T) & { _hook: Computed<T> }
export function computed<T>(
  fn: FComputedFunc<T>
): (() => T) & { _hook: Computed<T> }
export function computed<T>(fn: any): any {
  if (!currentRunnerScope) {
    throw new Error('[computed] must under a tarat runner')
  }
  return currentHookFactory.computed<T>(fn)
}

export function computedInServer<T>(
  fn: FComputedFuncGenerator<T>
): (() => T) & { _hook: Computed<T> }
export function computedInServer<T>(
  fn: FComputedFuncAsync<T>
): (() => T) & { _hook: Computed<T> }
export function computedInServer<T>(
  fn: FComputedFunc<T>
): (() => T) & { _hook: Computed<T> }
export function computedInServer<T>(fn: any): any {
  if (!currentRunnerScope) {
    throw new Error('[computed] must under a tarat runner')
  }
  return currentHookFactory.computedInServer<T>(fn)
}

type InputComputeFn<T extends any[]> = (...arg: T) => void
type AsyncInputComputeFn<T extends any[]> = (...arg: T) => Promise<void>
type GeneratorInputComputeFn<T extends any[]> = (
  ...arg: T
) => Generator<unknown, void, T>

function updateInputCompute(func: any) {
  const { hooks, initialHooksSet } = currentRunnerScope!
  const currentIndex = hooks.length
  const valid = !initialHooksSet || initialHooksSet.has(currentIndex)

  if (!valid) {
    currentRunnerScope!.addHook(undefined)
    return createUnaccessGetter(currentIndex)
  }

  return mountInputCompute(func)
}
function mountInputCompute(func: any) {
  const hook = new InputCompute(func, currentRunnerScope)
  currentRunnerScope.addHook(hook)
  currentReactiveChain?.add(hook)
  const wrapFunc = (...args: any) => {
    return hook.run(...args)
  }
  wrapFunc._hook = hook

  return wrapFunc
}

export function inputCompute<T extends any[]>(
  func: AsyncInputComputeFn<T>
): AsyncInputComputeFn<T> & { _hook: Hook }
export function inputCompute<T extends any[]>(
  func: GeneratorInputComputeFn<T>
): AsyncInputComputeFn<T> & { _hook: Hook }
export function inputCompute<T extends any[]>(
  func: InputComputeFn<T>
): InputComputeFn<T> & { _hook: Hook }
export function inputCompute(func: any) {
  if (!currentRunnerScope) {
    throw new Error('[inputCompute] must under a tarat runner')
  }
  const wrapFunc = currentHookFactory.inputCompute(func)
  return wrapFunc
}

function updateInputComputeInServer(func: any) {
  const { hooks, initialHooksSet } = currentRunnerScope!
  const currentIndex = hooks.length
  const valid = !initialHooksSet || initialHooksSet.has(currentIndex)

  if (!valid) {
    currentRunnerScope!.addHook(undefined)
    return createUnaccessGetter(currentIndex)
  }
  return mountInputComputeInServer(func)
}

function mountInputComputeInServer(func: any) {
  const hook = new InputComputeInServer(func, currentRunnerScope)
  currentRunnerScope.addHook(hook)
  currentReactiveChain?.add(hook)
  const wrapFunc = (...args: any) => {
    return hook.run(...args)
  }
  wrapFunc._hook = hook

  return wrapFunc
}

export function inputComputeInServer<T extends any[]>(
  func: AsyncInputComputeFn<T>
): AsyncInputComputeFn<T> & { _hook: Hook }
export function inputComputeInServer<T extends any[]>(
  func: GeneratorInputComputeFn<T>
): AsyncInputComputeFn<T> & { _hook: Hook }
export function inputComputeInServer<T extends any[]>(
  func: InputComputeFn<T>
): AsyncInputComputeFn<T> & { _hook: Hook }
export function inputComputeInServer(func: any) {
  if (!currentRunnerScope) {
    throw new Error('[inputComputeServer] must under a tarat runner')
  }
  /**
   * running in client should post request to server
   * if already in server, should execute directly
   */
  if (process.env.TARGET === 'server') {
    return inputCompute(func)
  }
  const wrapFunc = currentHookFactory.inputComputeInServer(func)
  return wrapFunc
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
export function after(callback: () => void, targets: { _hook?: Hook }[]) {
  callback = makeBatchCallback(callback)

  targets.forEach(target => {
    if (target._hook) {
      if (target._hook instanceof InputCompute) {
        target._hook.on(EHookEvents.afterCalling, callback)
      } else {
        target._hook.on(EHookEvents.change, callback)
      }
    }
  })
}

export function before(callback: () => void, targets: { _hook?: Hook }[]) {
  callback = makeBatchCallback(callback)

  targets.forEach(target => {
    if (target._hook) {
      if (target._hook instanceof InputCompute) {
        target._hook.on(EHookEvents.beforeCalling, callback)
      }
    }
  })
}

export function combineLatest<T>(
  arr: Array<Function & { _hook: State<T> }>
): () => T {
  return () => {
    const latestState = arr.slice(1).reduce((latest, hook) => {
      const { _hook } = hook
      if (!_hook) {
        return latest
      }
      if (!latest._hook) {
        return hook
      }
      if (_hook.modifiedTimstamp > latest._hook.modifiedTimstamp) {
        return hook
      }
      return latest
    }, arr[0])

    return latestState?.()
  }
}

/**
 * using another Driver inside of Driver
 * the important thing is that should consider how to compose their depsMap
 */
export function compose<T extends Driver>(f: T, args?: any[]) {
  if (!currentRunnerScope) {
    throw new Error('[compose] must run side of Driver')
  }

  const startIndex = currentRunnerScope.hooks.length

  let names = getNames(f)
  const driverName = getName(f)
  if (driverName && names) {
    const composeIndex = currentRunnerScope.composes.length
    names = names.map(arr => [
      arr[0],
      `compose.${composeIndex}.${driverName}.${arr[1]}`
    ])
    currentRunnerScope.appendComposeNames(startIndex, names)
  }

  const endIndex = startIndex + names.length
  const deps = getDeps(f)
  currentRunnerScope.appendComposeDeps(startIndex, endIndex, deps)

  const driverNamespace = getNamespace(f)
  const leaveCompose = currentRunnerScope.enterComposeDriver(driverNamespace)

  const insideResult: ReturnType<T> = executeDriver(f, args)

  leaveCompose()
  currentRunnerScope.composes.push(insideResult)

  return insideResult
}

/**
 * inject input data to Model as initial value
 */
type TModelGetter<T> = ReturnType<typeof model | typeof writePrisma>
export function connectModel<T>(
  modelGetter: TModelGetter<T>,
  dataGetter: TGetterData<T>
) {
  modelGetter._hook.setGetter(dataGetter)
}

export function injectModel<T>(
  modelGetter: ReturnType<typeof writePrisma>,
  dataGetter: TGetterData<T>
) {
  modelGetter._hook.injectGetter(dataGetter)
}

export function progress<T = any>(getter: {
  _hook: AsyncState<T> | AsyncInputCompute<T[]>
}) {
  const hook = getter._hook
  return () => ({
    state: hook.init
      ? EScopeState.init
      : hook.pending
      ? EScopeState.pending
      : EScopeState.idle
  })
}
