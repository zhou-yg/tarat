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
  BM,
  checkQueryWhere,
  isPrimtive
} from './util'
import { produceWithPatches, Draft, enablePatches, applyPatches } from 'immer'
import { getPlugin, IModelQuery, TCacheFrom } from './plugin'

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
  notify: (hook?: T, patches?: IPatch[]) => void
}

interface ISource<U> {
  watchers: Set<Watcher<U>>
  addWatcher: (w: Watcher<U>) => void
}

export class Watcher<T = Hook> {
  deps: Map<ISource<T>, (string | number)[][]> = new Map()
  constructor(public target: ITarget<ISource<T>>) {}
  notify(dep: ISource<T>, path: TPath, patches?: IPatch[]) {
    const paths = this.deps.get(dep)
    const matched = paths?.some(p => isEqual(p, path))
    if (matched) {
      this.target.notify(dep, patches)
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

export class Hook {
  freezed?: boolean
  watchers = new Set<Watcher<typeof this>>()
  addWatcher(w: Watcher<Hook>) {
    this.watchers.add(w)
  }
}
export function isState(h: { _hook?: State }) {
  return h && (h._hook ? h._hook instanceof State : h instanceof State)
}
export class State<T = any> extends Hook {
  _internalValue: T
  freezed?: boolean
  modifiedTimstamp = Date.now()
  inputComputePatchesMap: Map<InputCompute, [T, IPatch[]]> = new Map()
  constructor(data: T) {
    super()
    this._internalValue = data
  }
  trigger(path: (number | string)[] = [''], patches?: IPatch[]) {
    if (!path || path.length === 0) {
      path = ['']
    }
    this.watchers.forEach(w => {
      w.notify(this, path, patches)
    })
  }
  get value(): T {
    if (currentInputeCompute) {
      return this.getInputComputeDraftValue()
    }
    return internalProxy(this, this._internalValue)
  }
  update(v: T, patches?: IPatch[], silent?: boolean) {
    const oldValue = this._internalValue
    this._internalValue = v
    const shouldTrigger = oldValue !== v && !isEqual(oldValue, v)
    if (shouldTrigger) {
      this.modifiedTimstamp = Date.now()
    }
    if (silent) {
      return
    }

    // trigger only changed
    if (shouldTrigger) {
      this.trigger()

      if (patches && patches.length > 0) {
        const changedPathArr = calculateChangedPath(oldValue, patches)
        changedPathArr.forEach(path => this.trigger(path, patches))
      }
    }
  }
  applyInputComputePatches(ic: InputCompute) {
    let exist = this.inputComputePatchesMap.get(ic)
    if (exist) {
      this.inputComputePatchesMap.delete(ic)
      this.update(exist[0], exist[1])
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
  addInputComputePatches(value: T, patches: IPatch[]) {
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
    }
  }
}

export class Model<T extends any[]> extends State<T[]> {
  getterPromise: Promise<T> | null = null
  queryWhereComputed: Computed<IModelQuery> | null = null
  watcher: Watcher = new Watcher(this)
  init = true
  constructor(
    getQueryWhere: () => IModelQuery,
    public options: IModelOption = {},
    public scope: CurrentRunnerScope
  ) {
    super([])
    scope.addHook(this)

    this.queryWhereComputed = new Computed(getQueryWhere)
    this.watcher.addDep(this.queryWhereComputed)

    // default to immediate
    if (options.immediate || options.immediate === undefined) {
      this.query()
    }
  }
  notify() {
    log(`[${this.constructor.name}.executeQuery]`)
    this.executeQuery()
  }
  async getQueryWhere(): Promise<IModelQuery> {
    await this.queryWhereComputed!.getterPromise
    return this.queryWhereComputed!.value!
  }
  override get value(): T[] {
    if (this.init) {
      this.query()
    }
    return super.value
  }
  async ready() {
    if (this.getterPromise) {
      await this.getterPromise
    }
  }
  query() {
    log(`[${this.constructor.name}.query]`)
    this.queryWhereComputed?.run()
  }
  async enableQuery() {
    const q = await this.getQueryWhere()
    const valid = checkQueryWhere(q.query.where)
    return valid || this.options.ignoreEnable
  }
  async executeQuery() {
    this.init = false
    let resolve: Function
    this.getterPromise = new Promise(r => (resolve = r))
    try {
      // @TODO：要确保时序，得阻止旧的query数据更新
      const q = await this.getQueryWhere()
      const valid = await this.enableQuery()
      log(
        '[Model.executeQuery] 1 q.entity, q.query: ',
        q.entity,
        q.query,
        valid
      )
      if (valid) {
        const result: T = await getPlugin('Model').find(q.entity, q.query)
        log('[Model.executeQuery] 2 result: ', result)
        this.update(result)
      }
    } catch (e) {
      log('[Model.executeQuery] error')
      console.error(e)
    } finally {
      resolve!()
      this.getterPromise = null
    }
  }
  async exist(obj: { [k: string]: any }) {
    const q = await this.getQueryWhere()
    const result: T = await getPlugin('Model').find(q.entity, { where: obj })
    return result.length > 0
  }
  override async applyInputComputePatches(ic: InputCompute) {
    const exist = this.inputComputePatchesMap.get(ic)
    if (exist) {
      this.inputComputePatchesMap.delete(ic)
      const patches = exist[1]
      const newValue = applyPatches(this._internalValue, patches)
      await this.updateWithPatches(newValue, patches)
    }
  }
  async updateWithPatches(v: T[], patches: IPatch[]) {
    const oldValue = this._internalValue
    if (!this.options.pessimisticUpdate) {
      log('[Model.updateWithPatches] update internal v=', v)
      this.update(v, patches)
    }

    let resolve: Function
    this.getterPromise = new Promise(r => (resolve = r))

    const { entity } = await this.getQueryWhere()
    try {
      const diff = calculateDiff(oldValue, patches)
      log('[Model.updateWithPatches] diff: ', diff)
      await getPlugin('Model').executeDiff(entity, diff)
    } catch (e) {
      console.info('[updateWithPatches] postPatches fail', e)
      if (this.options.autoRollback) {
        this.update(oldValue)
      }
    } finally {
      resolve!()
      this.getterPromise = null
    }
    await this.executeQuery()
  }
}

class ClientModel<T extends any[]> extends Model<T> {
  override async executeQuery() {
    let resolve: Function
    this.getterPromise = new Promise(r => (resolve = r))

    const valid = await this.enableQuery()
    if (valid) {
      const context = this.scope.createInputComputeContext(this)
      log('[ClientModel.executeQuery] before post : ')
      const result: IHookContext = await getPlugin('Context').postQueryToServer(
        context
      )
      this.getterPromise = null

      const index = this.scope.hooks.indexOf(this)
      const d = result.data[index]
      if (d[1]) {
        this.update(d[1])
      }
    }
    resolve!()
    this.getterPromise = null
  }
  override async updateWithPatches(v: T, patches: IPatch[]) {
    throw new Error('cant update in client')
  }
}

export interface ICacheOptions<T> {
  source?: { _hook: State<T> }
  defaultValue?: T
  from: TCacheFrom
}
export class Cache<T> extends State<T | undefined> {
  getterKey: string
  watcher: Watcher = new Watcher(this)
  source: State<T> | undefined
  getterPromise: Promise<any> | null = null
  constructor(
    key: string,
    public options: ICacheOptions<T>,
    public scope: CurrentRunnerScope
  ) {
    super(undefined)
    scope.addHook(this)
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
  notify(hook?: Hook) {
    const { from } = this.options
    const { source } = this
    if (hook && source && hook === source) {
      // not calling update prevent notify the watcher for current cache
      this._internalValue = undefined
      /**
       * just clear value in cache not update directly
       * reason 1: for lazy
       * reason 2: prevent writing conflict while coccurent writing at same time
       */
      getPlugin('Cache').clearValue(this.scope, this.getterKey, from)

      this.executeQuery()
    }
  }
  override get value(): T | undefined {
    if (this._internalValue === undefined) {
      this.executeQuery()
    }
    return super.value
  }
  async executeQuery() {
    const { from } = this.options
    const { source } = this

    let resolve: Function
    this.getterPromise = new Promise(r => (resolve = r))

    try {
      const valueInCache = await getPlugin('Cache').getValue<T>(
        this.scope,
        this.getterKey,
        from
      )
      if (valueInCache !== undefined) {
        super.update(valueInCache)
      } else if (source) {
        const valueInSource = source.value

        super.update(valueInSource)
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
      resolve!()
      this.getterPromise = null
    }
  }
  // call by outer
  override async update(v?: T, patches?: IPatch[], silent?: boolean) {
    const { from } = this.options
    const { source } = this
    if (source) {
      throw new Error(
        '[Cache] can not update value directly while the cache has "source" in options '
      )
    } else {
      super.update(v, patches, silent)
      await getPlugin('Cache').setValue(this.scope, this.getterKey, v, from)
    }
  }
}

export class Computed<T> extends State<T | undefined> {
  getterPromise: Promise<T> | null = null
  batchRunCancel: () => void = () => {}
  watcher: Watcher<State<any>> = new Watcher<State<any>>(this)
  // @TODO: maybe here need trigger async optional setting
  constructor(public getter: FComputedFunc<T> | FComputedFuncAsync<T>) {
    super(undefined)
  }
  run() {
    currentComputed = this
    const r: any = this.getter()
    currentComputed = null
    if (r && (r.then || r instanceof Promise)) {
      this.getterPromise = r
      r.then((asyncResult: T) => {
        this.update(asyncResult)
        this.getterPromise = null
      })
    } else {
      this.update(r)
    }
  }
  notify() {
    /**
     * trigger synchronism
     */
    this.run()

    // this.batchRunCancel()
    // this.batchRunCancel = nextTick(() => {
    //   this.run()
    // })
  }
}

class InputCompute<P extends any[] = any> extends Hook {
  constructor(
    public getter: InputComputeFn<P>,
    public scope: CurrentRunnerScope
  ) {
    super()
    scope.addHook(this)
  }
  inputFuncStart() {}
  async inputFuncEnd() {
    currentInputeCompute = null
    this.scope.applyComputePatches(this)
    unFreeze({ _hook: this })
    this.triggerEvent('after')
  }
  async run(...args: any): Promise<void> {
    currentInputeCompute = this
    this.triggerEvent('before')
    if (!checkFreeze({ _hook: this })) {
      const funcResult = this.getter(...args)
      if (isPromise(funcResult)) {
        await Promise.resolve(funcResult)
        return await this.inputFuncEnd()
      }
    }
    return this.inputFuncEnd()
  }
  triggerEvent(timing: 'before' | 'after') {
    this.watchers.forEach(w => {
      w.notify(this, [timing], [])
    })
  }
}
class InputComputeInServer<P extends any[]> extends InputCompute<P> {
  getterPromise: Promise<any> | null = null
  async run(...args: any[]) {
    let resolve: Function
    this.getterPromise = new Promise(r => (resolve = r))

    this.triggerEvent('before')
    if (!checkFreeze({ _hook: this })) {
      const context = this.scope.createInputComputeContext(this, args)
      const result = await getPlugin('Context').postComputeToServer(context)
      this.scope.applyContext(result)
    }
    this.inputFuncEnd()

    resolve!()
    this.getterPromise = null
  }
}
class Effect<T> extends Hook {
  getterPromise: Promise<T> | null = null
  batchRunCancel: () => void = () => {}
  watcher: Watcher<Hook> = new Watcher<Hook>(this)
  cancelNotify = () => {}
  constructor(public callback: () => void, public scope: CurrentRunnerScope) {
    super()
    scope.addHook(this)
  }
  notify() {
    this.cancelNotify()
    this.cancelNotify = nextTick(() => {
      this.callback()
    })
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

export class CurrentRunnerScope {
  hooks: Hook[] = []
  // computePatches: Array<[State, IPatch[]]> = []
  outerListeners: Function[] = []
  stateChangeCallbackRunning = false
  stateChangeCallbackCancel = () => {}
  stateChangeWaitHooks: Set<Hook> = new Set<Hook>()
  watcher: Watcher<Hook> = new Watcher(this)
  initialArgList: any[] = []
  intialContextData: IHookContext['data'] | null = null
  hookRunnerName = ''
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
    this.stateChangeCallbackCancel()
    this.stateChangeCallbackCancel = nextTick(() => {
      this.notifyOuter()
    })
  }
  setIntialArgs(argList: any[], name: string) {
    this.initialArgList = argList || []
    this.hookRunnerName = name
  }

  setInitialContextData(contex: IHookContext) {
    this.intialContextData = contex['data']
  }

  addHook(v: Hook) {
    if (this.hooks.indexOf(v) !== -1) {
      throw new Error('add repeat hook')
    }
    this.hooks.push(v)
    this.watcher.addDep(v)
  }

  applyComputePatches(currentInputCompute: InputCompute) {
    const hookModified = this.hooks.filter(h => {
      if (h && (h as State).inputComputePatchesMap) {
        return (h as State).inputComputePatchesMap.get(currentInputCompute)
      }
    })

    if (hookModified.length) {
      hookModified.forEach(h => {
        ;(h as State).applyInputComputePatches(currentInputCompute)
      })
    }
  }

  createInputComputeContext(h?: Hook, args?: any[]): IHookContext {
    const { hooks } = this
    const hookIndex = h ? hooks.indexOf(h) : -1
    const hooksData: IHookContext['data'] = hooks.map(hook => {
      // if (hook instanceof ClientModel) {
      //   return ['clientModel', hook.value]
      // }
      if (hook instanceof Model) {
        return ['model', hook.value]
      }
      if (hook instanceof Computed) {
        return ['computed', hook.value]
      }
      if (hook instanceof Cache) {
        return ['cache', hook.value]
      }
      if (hook instanceof InputCompute) {
        return ['inputCompute', null]
      }
      if (hook instanceof State) {
        return ['state', hook.value]
      }
      return ['undef', undefined]
    })
    return {
      initialArgList: this.initialArgList,
      name: this.hookRunnerName,
      data: hooksData,
      index: hookIndex,
      args: args || []
    }
  }
  applyContext(c: IHookContext) {
    const contextData = c.data
    const { hooks } = this
    contextData.forEach(([type, value], index) => {
      if (isDef(value)) {
        const state = hooks[index] as State
        switch (type) {
          default:
            /**
             * default to keep silent because of deliver total context now
             */
            state.update?.(value, [], true)
            break
        }
      }
    })
    this.notify()
  }
  ready(): Promise<void> {
    const asyncHooks = this.hooks.filter(h =>
      Reflect.has(h, 'getterPromise')
    ) as unknown as { getterPromise: Promise<any> | null }[]

    let readyResolve: () => void
    let readyPromise = new Promise<void>(resolve => (readyResolve = resolve))

    async function wait() {
      let notReadyHooks = asyncHooks.map(h => h.getterPromise).filter(Boolean)
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

let currentRunnerScope: CurrentRunnerScope | null = null

export class Runner<T extends BM> {
  scope = new CurrentRunnerScope()
  alreadyInit = false
  constructor(public bm: T) {}
  onUpdate(f: Function) {
    return this.scope?.onUpdate(() => {
      f()
    })
  }
  init(args?: Parameters<T>, initialContext?: IHookContext): ReturnType<T> {
    if (this.alreadyInit) {
      throw new Error('can not init repeat')
    }
    currentRunnerScope = this.scope
    currentRunnerScope.setIntialArgs(args || [], this.bm.name)
    if (initialContext) {
      currentRunnerScope.setInitialContextData(initialContext)
      currentHookFactory = updateHookFactory
    } else {
      currentHookFactory = mountHookFactory
    }

    const result: ReturnType<T> = executeBM(this.bm, args)

    currentRunnerScope = null

    this.alreadyInit = true

    return result
  }
  /**
   * call the executable hook: Model, InputCompute
   * @TODO the executable hook maybe need a abstract base class
   */
  async callHook(hookIndex: number, args: any[]) {
    const hook = this.scope.hooks[hookIndex]
    if (hook) {
      if (hook instanceof Model) {
        // console.log('callHook hookIndex=', hookIndex)
        // await (hook as Model<any>).query()
      } else {
        await (hook as InputCompute).run(...args)
      }
    }
  }
  ready() {
    return this.scope.ready()
  }
}

function executeBM(f: BM, args: any = []) {
  const bmResult = f(...args)

  if (bmResult) {
    map(bmResult, v => {
      if (v instanceof State) {
      } else if (v instanceof Model) {
      } else if (isInputCompute(v)) {
      }
    })
  }

  return bmResult
}

export function internalProxy<T>(
  source: State<T>,
  _internalValue: T,
  path: (string | number)[] = []
): T {
  if (currentComputed) {
    currentComputed.watcher.addDep(source, path)
    if (_internalValue && likeObject(_internalValue)) {
      const copyValue = shallowCopy(_internalValue)
      return new Proxy(copyValue as any, {
        get(target, p: string) {
          return internalProxy(source, Reflect.get(target, p), path.concat(p))
        }
      })
    }
  }
  return _internalValue
}

let currentInputeCompute: InputCompute | null = null

type IModifyFunction<T> = (draft: Draft<T>) => void

function createStateSetterGetterFunc<SV>(
  s: State<SV>,
  scope: CurrentRunnerScope
): {
  (): SV
  (paramter: IModifyFunction<SV>): [SV, IPatch[]]
} {
  return (paramter?: any): any => {
    if (paramter) {
      if (isFunc(paramter)) {
        const [result, patches] = produceWithPatches(s.value, paramter)
        if (currentInputeCompute) {
          s.addInputComputePatches(result, patches)
        } else {
          s.update(result, patches)
        }
        return [result, patches]
      } else {
        throw new Error('[change state] pass a function')
      }
    }
    return s.value
  }
}

interface IModelOption {
  immediate?: boolean
  unique?: boolean
  autoRollback?: boolean
  pessimisticUpdate?: boolean
  ignoreEnable?: boolean
}

function createModelSetterGetterFunc<T extends any[]>(
  m: Model<T>,
  scope: CurrentRunnerScope
): {
  (): T | undefined
  (paramter: IModifyFunction<T | undefined>): Promise<[T | undefined, IPatch[]]>
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
        m.addInputComputePatches(result, patches)
      } else {
        m.updateWithPatches(result, patches)
      }
      return [result, patches]
    }
    return m.value
  }
}

function isInputCompute(v: any) {
  return v.__inputComputeTag
}

let currentComputed: null | Computed<any> = null

export function setCurrentComputed(c: Computed<any> | null) {
  currentComputed = c
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
  model: mountModel,
  clientModel: mountClientModel,
  cache: mountCache,
  computed: mountComputed,
  inputCompute,
  inputComputeInServer,
  before,
  after,
  combineLatest
}
export const updateHookFactory = {
  state: updateState,
  model: updateModel,
  clientModel: updateClientModel,
  cache: updateCache,
  computed: updateComputed,
  inputCompute,
  inputComputeInServer,
  before,
  after,
  combineLatest
}

export let currentHookFactory: {
  state: typeof mountState
  model: typeof mountModel
  clientModel: typeof mountClientModel
  cache: typeof mountCache
  computed: typeof mountComputed
  inputCompute: typeof inputCompute
  inputComputeInServer: typeof inputComputeInServer
  before: typeof before
  after: typeof after
  combineLatest: typeof combineLatest
} = updateHookFactory

function createUnaccessGetter<T>(index: number) {
  const f = () => {
    throw new Error(`[update getter] cant access un initialized hook(${index})`)
  }
  const newF: (() => any) & { _hook: any } = Object.assign(f, {
    _hook: null
  })
  return newF
}
function createUnaccessGetter2<T extends any[]>(index: number) {
  const f = (): any => {
    throw new Error(`[update getter] cant access un initialized hook(${index})`)
  }
  const newF: (() => any) & { _hook: any; exist: any } = Object.assign(f, {
    _hook: null,
    exist: () => true
  })
  return newF
}

function updateState<T>(initialValue: T) {
  const currentIndex = currentRunnerScope!.hooks.length
  initialValue = currentRunnerScope!.intialContextData![currentIndex]?.[1]
  // undefined means this hook wont needed in this progress
  if (initialValue === undefined) {
    return createUnaccessGetter<T>(currentIndex)
  }
  const internalState = new State(initialValue)

  const setterGetter = createStateSetterGetterFunc(
    internalState,
    currentRunnerScope!
  )
  currentRunnerScope!.addHook(internalState)

  const newSetterGetter = Object.assign(setterGetter, {
    _hook: internalState
  })

  return newSetterGetter
}
function mountState<T>(initialValue: T) {
  const internalState = new State(initialValue)

  const setterGetter = createStateSetterGetterFunc(
    internalState,
    currentRunnerScope!
  )
  currentRunnerScope!.addHook(internalState)

  const newSetterGetter = Object.assign(setterGetter, {
    _hook: internalState
  })

  return newSetterGetter
}

function updateModel<T extends any[]>(q: () => IModelQuery, op?: IModelOption) {
  const currentIndex = currentRunnerScope!.hooks.length
  const initialValue: T =
    currentRunnerScope!.intialContextData![currentIndex]?.[1]
  if (initialValue === undefined) {
    return createUnaccessGetter2<T>(currentIndex)
  }
  const immediate = process.env.TARGET === 'server'

  op = Object.assign({}, op, {
    immediate
  })

  const internalModel =
    process.env.TARGET === 'server'
      ? new Model<T>(q, op, currentRunnerScope!)
      : new ClientModel<T>(q, op, currentRunnerScope!)

  const setterGetter = createModelSetterGetterFunc<T>(
    internalModel,
    currentRunnerScope!
  )
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: internalModel,
    exist: internalModel.exist.bind(internalModel)
  })

  return newSetterGetter
}
function mountModel<T extends any[]>(q: () => IModelQuery, op?: IModelOption) {
  const internalModel =
    process.env.TARGET === 'server'
      ? new Model<T>(q, op, currentRunnerScope!)
      : new ClientModel<T>(q, op, currentRunnerScope!)

  const setterGetter = createModelSetterGetterFunc<T>(
    internalModel,
    currentRunnerScope!
  )
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: internalModel,
    exist: internalModel.exist.bind(internalModel)
  })

  return newSetterGetter
}

function updateClientModel<T extends any[]>(
  q: () => IModelQuery,
  op?: IModelOption
) {
  const currentIndex = currentRunnerScope!.hooks.length
  const initialValue: T =
    currentRunnerScope!.intialContextData![currentIndex]?.[1]
  if (initialValue === undefined) {
    return createUnaccessGetter2<T>(currentIndex)
  }
  const inServer = process.env.TARGET === 'server'

  op = Object.assign({}, op, {
    immediate: inServer
  })

  const internalModel = inServer
    ? new Model<T>(q, op, currentRunnerScope!)
    : new ClientModel<T>(q, op, currentRunnerScope!)

  if (!inServer) {
    internalModel.init = inServer
    internalModel._internalValue = initialValue || []
  }

  const setterGetter = createModelSetterGetterFunc<T>(
    internalModel,
    currentRunnerScope!
  )
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: internalModel,
    exist: internalModel.exist.bind(internalModel)
  })

  return newSetterGetter
}

function mountClientModel<T extends any[]>(
  q: () => IModelQuery,
  op?: IModelOption
) {
  const internalModel = new ClientModel<T>(q, op, currentRunnerScope!)

  const setterGetter = createModelSetterGetterFunc<T>(
    internalModel,
    currentRunnerScope!
  )
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: internalModel,
    exist: internalModel.exist.bind(internalModel)
  })

  return newSetterGetter
}

function createCacheSetterGetterFunc<SV>(
  c: Cache<SV>,
  scope: CurrentRunnerScope
): {
  (): SV
  (paramter: IModifyFunction<SV>): [SV, IPatch[]]
} {
  return (paramter?: any): any => {
    if (paramter) {
      if (isFunc(paramter)) {
        const [result, patches] = produceWithPatches(c.value, paramter)
        if (currentInputeCompute) {
          c.addInputComputePatches(result, patches)
        } else {
          c.update(result, patches)
        }
        return [result, patches]
      } else {
        throw new Error('[change cache] pass a function')
      }
    }
    return c.value
  }
}

function updateCache<T>(key: string, options: ICacheOptions<T>) {
  const currentIndex = currentRunnerScope!.hooks.length
  const initialValue: T =
    currentRunnerScope!.intialContextData![currentIndex]?.[1]
  if (initialValue === undefined) {
    return createUnaccessGetter<T>(currentIndex)
  }

  const hook = new Cache(key, options, currentRunnerScope!)
  hook.executeQuery()

  const setterGetter = createCacheSetterGetterFunc(hook, currentRunnerScope!)
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: hook
  })
  return newSetterGetter
}
function mountCache<T>(key: string, options: ICacheOptions<T>) {
  const hook = new Cache(key, options, currentRunnerScope!)

  const setterGetter = createCacheSetterGetterFunc(hook, currentRunnerScope!)
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: hook
  })
  return newSetterGetter
}

function updateComputed<T>(
  fn: FComputedFuncAsync<T>
): (() => Promise<T>) & { _hook: Computed<T> }
function updateComputed<T>(
  fn: FComputedFunc<T>
): (() => T) & { _hook: Computed<T> }
function updateComputed<T>(fn: any): any {
  const currentIndex = currentRunnerScope!.hooks.length
  const initialValue: T =
    currentRunnerScope!.intialContextData![currentIndex]?.[1]
  if (initialValue === undefined) {
    return createUnaccessGetter<T>(currentIndex)
  }
  const hook = new Computed<T>(fn)
  currentRunnerScope!.addHook(hook)
  // @TODO: update computed won't trigger
  hook._internalValue = initialValue
  hook.run()

  const getter = () => hook.value
  const newGetter = Object.assign(getter, {
    _hook: hook
  })
  return newGetter
}
function mountComputed<T>(
  fn: FComputedFuncAsync<T>
): (() => Promise<T>) & { _hook: Computed<T> }
function mountComputed<T>(
  fn: FComputedFunc<T>
): (() => T) & { _hook: Computed<T> }
function mountComputed<T>(fn: any): any {
  const hook = new Computed<T>(fn)
  currentRunnerScope!.addHook(hook)
  
  hook.run()

  const getter = () => hook.value
  const newGetter = Object.assign(getter, {
    _hook: hook
  })
  return newGetter
}

export function state<T>(initialValue: T) {
  if (!currentRunnerScope) {
    throw new Error('[state] must under a tarat runner')
  }
  return currentHookFactory.state<T>(initialValue)
}

export function model<T extends any[]>(
  q: () => IModelQuery,
  op?: IModelOption
) {
  if (!currentRunnerScope) {
    throw new Error('[model] must under a tarat runner')
  }
  return currentHookFactory.model<T>(q, op)
}

export function clientModel<T extends any[]>(
  q: () => IModelQuery,
  op?: IModelOption
) {
  if (!currentRunnerScope) {
    throw new Error('[model] must under a tarat runner')
  }
  return currentHookFactory.clientModel<T>(q, op)
}

export function cache<T>(key: string, options: ICacheOptions<T>) {
  return currentHookFactory.cache<T>(key, options)
}

type FComputedFuncAsync<T> = () => Promise<T>
type FComputedFunc<T> = () => T

export function computed<T>(
  fn: FComputedFuncAsync<T>
): (() => Promise<T>) & { _hook: Computed<T> }
export function computed<T>(
  fn: FComputedFunc<T>
): (() => T) & { _hook: Computed<T> }
export function computed<T>(fn: any): any {
  if (!currentRunnerScope) {
    throw new Error('[computed] must under a tarat runner')
  }
  return currentHookFactory.computed<T>(fn)
}

type InputComputeFn<T extends any[]> = (...arg: T) => void
type AsyncInputComputeFn<T extends any[]> = (...arg: T) => Promise<void>

export function inputCompute<T extends any[]>(
  func: AsyncInputComputeFn<T>
): AsyncInputComputeFn<T> & { _hook: Hook }
export function inputCompute<T extends any[]>(
  func: InputComputeFn<T>
): InputComputeFn<T> & { _hook: Hook }
export function inputCompute(func: any) {
  if (!currentRunnerScope) {
    throw new Error('[inputCompute] must under a tarat runner')
  }

  const hook = new InputCompute(func, currentRunnerScope)

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

  const hook = new InputComputeInServer(func, currentRunnerScope)

  const wrapFunc = (...args: any) => {
    return hook.run(...args)
  }
  wrapFunc._hook = hook
  return wrapFunc
}

export function after(callback: () => void, targets: { _hook?: Hook }[]) {
  const hook = new Effect(callback, currentRunnerScope!)

  targets.forEach(target => {
    if (target._hook) {
      if (target._hook instanceof InputCompute) {
        hook.watcher.addDep(target._hook, ['after'])
      } else {
        hook.watcher.addDep(target._hook, [''])
      }
    }
  })
}

export function before(callback: () => void, targets: { _hook?: Hook }[]) {
  const hook = new Effect(callback, currentRunnerScope!)

  targets.forEach(target => {
    if (target._hook) {
      if (target._hook instanceof InputCompute) {
        hook.watcher.addDep(target._hook, ['before'])
      }
    }
  })
}

export function combineLatest<T>(arr: Array<{ _hook: State<T> }>): () => T {
  return () => {
    const latestState = arr.slice(1).reduce((latest, { _hook }) => {
      if (_hook.modifiedTimstamp > latest.modifiedTimstamp) {
        return _hook
      }
      return latest
    }, arr[0]._hook)

    return latestState.value
  }
}
