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
  isUndef
} from './util'
import EventEmitter from 'eventemitter3'
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

export class State<T = any> extends Hook {
  _internalValue: T
  freezed?: boolean
  modifiedTimstamp = Date.now()
  inputComputePatchesMap: Map<InputCompute, [T, IPatch[]]> = new Map()
  constructor(data: T) {
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
    patches?: IPatch[],
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
  applyInputComputePatches(ic: InputCompute, reactiveChain?: ReactiveChain<T>) {
    let exist = this.inputComputePatchesMap.get(ic)
    if (exist) {
      this.inputComputePatchesMap.delete(ic)
      this.update(exist[0], exist[1], false, reactiveChain)
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
type PartialGetter<T> = {
  [K in keyof T]?: T[K]
}

type TGetterData<T> = () => PartialGetter<T>

class AsyncState<T> extends State<T> {
  init = true
  getterPromise: Promise<T> | null = null  
  startAsyncGetter () {
    this.init = false
    let resolve: Function
    this.getterPromise = new Promise(
      r =>
        (resolve = r)
    )

    return () => {
      resolve()
      this.getterPromise = null
    }
  }
}

export class Model<T extends any[]> extends AsyncState<T[]> {
  queryWhereComputed: Computed<IModelQuery['query'] | void> | null = null
  watcher: Watcher = new Watcher(this)
  // just update latest query
  queryTimeIndex: number = 0

  createGetters: TGetterData<T>[] = []

  constructor(
    public entity: string,
    getQueryWhere: (() => IModelQuery['query'] | void) | void = undefined,
    public options: IModelOption = {},
    public scope: CurrentRunnerScope
  ) {
    super([])
    scope.addHook(this)

    if (getQueryWhere) {
      this.queryWhereComputed = new Computed(getQueryWhere)
      this.watcher.addDep(this.queryWhereComputed)
    }

    // default to immediate
    if (options.immediate || options.immediate === undefined) {
      const reactiveChain: ReactiveChain<T> | undefined =
        currentReactiveChain?.add(this)
      this.query(reactiveChain)
    }
  }

  notify(h?: Hook, p?: IPatch[], reactiveChain?: ReactiveChain) {
    log(`[${this.constructor.name}.executeQuery] withChain=${!!reactiveChain}`)
    const newReactiveChain = reactiveChain?.add(this)
    this.executeQuery(newReactiveChain)
  }
  async getQueryWhere(): Promise<IModelQuery['query'] | void> {
    await this.queryWhereComputed!.getterPromise
    const queryWhereValue = this.queryWhereComputed!.value
    if (queryWhereValue && typeof queryWhereValue !== 'symbol') {
      return queryWhereValue as IModelQuery['query']
    }
  }
  override get value(): T[] {
    if (this.init) {
      const reactiveChain = currentReactiveChain?.addCall(this)
      this.query(reactiveChain)
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
      const newReactiveChain = reactiveChain?.add(this.queryWhereComputed)
      this.queryWhereComputed.run(newReactiveChain)
    }
  }
  async enableQuery() {
    const q = await this.getQueryWhere()
    const valid = q && checkQueryWhere(q)
    return !!q
  }
  async executeQuery(reactiveChain?: ReactiveChain) {
    this.queryTimeIndex++
    let currentQueryTimeIndex = this.queryTimeIndex

    const end = this.startAsyncGetter()
    try {
      // @TODO：要确保时序，得阻止旧的query数据更新
      const q = await this.getQueryWhere()
      log('[Model.executeQuery] 1 q.entity, q.query: ', this.entity, q)
      let result: T[] = []
      if (!!q) {
        if (this.queryTimeIndex <= currentQueryTimeIndex) {
          result = await getPlugin('Model').find(this.entity, q)
          log('[Model.executeQuery] 2 result: ', result)
        }
      }
      if (this.queryTimeIndex <= currentQueryTimeIndex) {
        this.update(result, [], false, reactiveChain)
      }
    } catch (e) {
      log('[Model.executeQuery] error')
      console.error(e)
    } finally {
      log('[Model.executeQuery] end')
      end()
    }
  }

  async exist(obj: { [k: string]: any }) {
    const result: T = await getPlugin('Model').find(this.entity, { where: obj })
    return result.length > 0
  }
  /**
   * confirm the last getter could convert previous getter
   */
  addCreateGetter(g: TGetterData<T[0]>) {
    this.createGetters.push(g)
  }
  async createRow(obj?: { [k: string]: any }) {
    const defaults = this.createGetters.reduce((r, func) => {
      return Object.assign(r, func())
    }, {} as T[0])

    await getPlugin('Model').create(this.entity, {
      data: Object.assign(defaults, obj)
    })
    await this.refresh()
  }
  async updateRow(
    where: number[] | { id: number }[],
    obj?: { [k: string]: any }
  ) {
    const id = typeof where[0] === 'number' ? where[0] : where[0].id

    await getPlugin('Model').update(this.entity, {
      where: { id },
      data: obj
    })
    await this.refresh()
  }
  async removeRow(where: number[] | { id: number }[]) {
    const id = typeof where[0] === 'number' ? where[0] : where[0].id

    await getPlugin('Model').remove(this.entity, {
      where: { id }
    })
    await this.refresh()
  }
  async refresh() {
    await this.executeQuery(currentReactiveChain?.add(this))
  }
  override async applyInputComputePatches(
    ic: InputCompute,
    reactiveChain?: ReactiveChain
  ) {
    const exist = this.inputComputePatchesMap.get(ic)
    if (exist) {
      this.inputComputePatchesMap.delete(ic)
      const patches = exist[1]
      const newValue = applyPatches(this._internalValue, patches)
      await this.updateWithPatches(newValue, patches, reactiveChain)
    }
  }
  async updateWithPatches(
    v: T[],
    patches: IPatch[],
    reactiveChain?: ReactiveChain
  ) {
    const oldValue = this._internalValue
    if (!this.options.pessimisticUpdate) {
      log('[Model.updateWithPatches] update internal v=', v)
      this.update(v, patches, false, reactiveChain)
    }

    const end = this.startAsyncGetter()

    const { entity } = this
    try {
      const diff = calculateDiff(oldValue, patches)
      log('[Model.updateWithPatches] diff: ', diff)
      await getPlugin('Model').executeDiff(entity, diff)
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
}

export class ClientModel<T extends any[]> extends Model<T> {
  override async executeQuery() {
    this.init = false

    const end = this.startAsyncGetter()

    const valid = await this.enableQuery()

    log(
      `[ClientModel.executeQuery] valid=${valid} ignoreClientEnable=${this.options.ignoreClientEnable}`
    )

    // @TODO: ignoreClientEnable will useless
    if (valid || this.options.ignoreClientEnable) {
      const context = this.scope.createInputComputeContext(this)
      log('[ClientModel.executeQuery] before post')
      const result: IHookContext = await getPlugin('Context').postQueryToServer(
        context
      )

      const index = this.scope.hooks.indexOf(this)
      const d = result.data[index]
      if (d[1]) {
        this.update(d[1])
      }
    }

    end()
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
export class Cache<T> extends AsyncState<T | undefined> {
  getterKey: string
  watcher: Watcher = new Watcher(this)
  source: State<T> | undefined
  getterPromise: Promise<any> | null = null
  // for only update latest value
  queryTimeIndex = 0

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
  notify(hook?: Hook, p?: IPatch[], reactiveChain?: ReactiveChain) {
    const { from } = this.options
    const { source } = this

    if (hook && source && hook === source) {
      log('[Cache.notify] source changed')
      // not calling update prevent notify the watcher for current cache
      this._internalValue = undefined
      /**
       * just clear value in cache not update directly
       * reason 1: for lazy
       * reason 2: prevent writing conflict while coccurent writing at same time
       */
      getPlugin('Cache').clearValue(this.scope, this.getterKey, from)

      const newReactiveChain = reactiveChain?.add(this)
      this.executeQuery(newReactiveChain)
    }
  }
  override get value(): T | undefined {
    if (this._internalValue === undefined) {
      const newReactiveChain = currentReactiveChain?.addCall(this)
      this.executeQuery(newReactiveChain)
    }
    return super.value
  }
  async executeQuery(reactiveChain?: ReactiveChain) {
    this.queryTimeIndex++
    let currentQueryTimeIndex = this.queryTimeIndex

    const { from } = this.options
    const { source } = this

    
    const end = this.startAsyncGetter()

    try {
      const valueInCache = await getPlugin('Cache').getValue<T>(
        this.scope,
        this.getterKey,
        from
      )
      if (this.queryTimeIndex > currentQueryTimeIndex) {
        return
      }
      log('[Cache.executeQuery] valueInCache=', valueInCache)
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
      log(`[Cache.executeQuery] end ${currentQueryTimeIndex}`)
      end()
    }
  }
  // call by outer
  override async update(
    v?: T,
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
      super.update(v, patches, silent, reactiveChain)
      await getPlugin('Cache').setValue(this.scope, this.getterKey, v, from)
    }
  }
}

let currentComputedStack: Computed<any>[] = []

function pushComputed(c: Computed<any>) {
  currentComputedStack.push(c)
}
function popComputed() {
  currentComputedStack.pop()
}

export function setCurrentComputed(c: Computed<any>[]) {
  currentComputedStack = c
}

export const ComputedInitial = Symbol('ComputedInitial')
export class Computed<T> extends AsyncState<T | Symbol> {
  batchRunCancel: () => void = () => {}
  watcher: Watcher<State<any>> = new Watcher<State<any>>(this)
  firstRun = true
  // @TODO: maybe here need trigger async optional setting
  constructor(
    public getter:
      | FComputedFunc<T | Symbol>
      | FComputedFuncAsync<T | Symbol>
      | FComputedFuncGenerator<T | Symbol>
  ) {
    super(ComputedInitial)
  }
  // override update (
  //   v: T,
  //   patches?: IPatch[],
  //   silent?: boolean,
  //   reactiveChain?: ReactiveChain<T>
  // ) {
  //   super.update(v, patches, silent, reactiveChain)
  //   if (this.firstRun && isUndef(v)) {
  //     this.trigger(undefined, undefined, reactiveChain)
  //     this.firstRun = false
  //   }
  // }
  run(reactiveChain?: ReactiveChain) {
    pushComputed(this)

    let oldCurrentReactiveChain: ReactiveChain | undefined =
      currentReactiveChain
    if (currentReactiveChain && reactiveChain) {
      currentReactiveChain = reactiveChain
    }
    // making sure the hook called by computed can register thier chain
    const r: T | Promise<T> | Generator<unknown, T> = this.getter(
      this._internalValue
    )
    currentReactiveChain = oldCurrentReactiveChain

    popComputed()
    if (isPromise(r)) {
      const end = this.startAsyncGetter();
      (r as Promise<T>).then((asyncResult: T) => {
        this.update(asyncResult, [], false, reactiveChain)
        end()
      })
    } else if (isGenerator(r)) {
      const end = this.startAsyncGetter();
      (runGenerator(
        r as Generator,
        () => pushComputed(this),
        () => popComputed()
      ) as Promise<T>).then((asyncResult: T) => {
        this.update(asyncResult, [], false, reactiveChain)
        end()
      })
    } else {
      this.update(r as T, [], false, reactiveChain)
    }
  }
  notify(h?: Hook, p?: IPatch[], reactiveChain?: ReactiveChain) {
    const newReactiveChain = reactiveChain?.add(this)
    /**
     * trigger synchronism
     */
    this.run(newReactiveChain)

    // this.batchRunCancel()
    // this.batchRunCancel = nextTick(() => {
    //   this.run()
    // })
  }
}
let currentInputeCompute: InputCompute | null = null

export class InputCompute<P extends any[] = any> extends Hook {
  constructor(
    public getter:
      | InputComputeFn<P>
      | AsyncInputComputeFn<P>
      | GeneratorInputComputeFn<P>,
    public scope: CurrentRunnerScope
  ) {
    super()
    scope.addHook(this)
  }
  inputFuncStart() {}
  async inputFuncEnd(reactiveChain?: ReactiveChain<P>) {
    if (currentInputeCompute === this) {
      currentInputeCompute = null
    }

    const updateReactiveChain: ReactiveChain | undefined =
      reactiveChain?.addUpdate(this)

    this.scope.applyComputePatches(this, updateReactiveChain)
    unFreeze({ _hook: this })
    this.emit(EHookEvents.afterCalling, this)
  }
  async run(...args: any): Promise<void> {
    // confirm：the composed inputCompute still running under the parent inputCompute
    if (!currentInputeCompute) {
      currentInputeCompute = this
    }
    this.emit(EHookEvents.beforeCalling, this)

    let preservedCurrentReactiveChain: ReactiveChain | undefined =
      currentReactiveChain
    const newReactiveChain = currentReactiveChain?.add(this)
    currentReactiveChain = newReactiveChain

    if (!checkFreeze({ _hook: this })) {
      const funcResult = this.getter(...args)

      if (newReactiveChain) {
        newReactiveChain.async = isPromise(funcResult)
      }
      currentReactiveChain = preservedCurrentReactiveChain

      // use generator
      if (isGenerator(funcResult)) {
        await runGenerator(
          funcResult as Generator<void>,
          () => {
            if (!currentInputeCompute) {
              currentInputeCompute = this
            }
          },
          () => {
            if (currentInputeCompute === this) {
              currentInputeCompute = null
            }
          }
        )
        return await this.inputFuncEnd(newReactiveChain)
      }
      if (isPromise(funcResult)) {
        // end compute context in advance

        if (currentInputeCompute === this) {
          currentInputeCompute = null
        }
        await funcResult

        return await this.inputFuncEnd(newReactiveChain)
      }
    }
    currentReactiveChain = preservedCurrentReactiveChain

    return this.inputFuncEnd(newReactiveChain)
  }
}

class AsyncInputCompute<T extends any[]> extends InputCompute<T> {
  init = true
  getterPromise: Promise<T> | null = null
  startAsyncGetter () {
    this.init = false
    let resolve: Function
    this.getterPromise = new Promise(
      r =>
        (resolve = r)
    )

    return () => {
      resolve()
      this.getterPromise = null
    }
  }
}

class InputComputeInServer<P extends any[]> extends AsyncInputCompute<P> {
  async run(...args: any[]) {
    const end = this.startAsyncGetter()

    this.emit(EHookEvents.beforeCalling, this)
    if (!checkFreeze({ _hook: this })) {
      const newReactiveChain = currentReactiveChain?.add(this)
      if (newReactiveChain) {
        newReactiveChain.async = true
      }

      const context = this.scope.createInputComputeContext(this, args)
      const result = await getPlugin('Context').postComputeToServer(context)
      this.scope.applyContextFromServer(result)
    }
    this.inputFuncEnd()

    end()
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
  currentReactiveChain.name = name
  return currentReactiveChain
}
export function stopReactiveChain() {
  currentReactiveChain = undefined
}
/**
 * collect reactive chain for debug
 */
export class ReactiveChain<T = any> {
  name?: string
  oldValue: T | undefined
  newValue: T | undefined
  hasNewValue: boolean = false
  children: ReactiveChain<T>[] = []
  type?: 'update' | 'notify' | 'call'
  async?: boolean
  constructor(public hook?: State<T> | InputCompute) {
    if (hook instanceof State) {
      this.oldValue = hook._internalValue
    }
  }
  update() {
    if (this.hook instanceof State) {
      this.hasNewValue = true
      this.newValue = this.hook._internalValue
    }
  }
  add(child: State<T> | InputCompute): ReactiveChain<T> {
    const childChain = new ReactiveChain(child)
    this.children.push(childChain)
    return childChain
  }
  addCall(child: State<T> | InputCompute): ReactiveChain<T> {
    const childChain = this.add(child)
    childChain.type = 'call'
    return childChain
  }
  addUpdate(child: State<T> | InputCompute): ReactiveChain<T> {
    const childChain = this.add(child)
    childChain.type = 'update'
    return childChain
  }
  print() {
    const preLink = '|--> '
    const preProp = '|-- '
    const preHasNextSpace = '|  '
    const preSpace = '   '

    function dfi(current: ReactiveChain) {
      let currentName = current.hook?.constructor.name || current.name || ''
      if (current.hook?.name) {
        currentName = `${currentName}(${current.hook?.name})`
      }
      if (current.type) {
        currentName = `${current.type}: ${currentName}`
      }

      const currentRows = [currentName]
      if (current.oldValue === undefined) {
        currentRows.push(`${preProp}cur=undef`)
      } else {
        currentRows.push(`${preProp}cur=${JSON.stringify(current.oldValue)}`)
      }
      if (current.hasNewValue) {
        if (current.newValue === undefined) {
          currentRows.push(`${preProp}new=undef`)
        } else {
          currentRows.push(`${preProp}new=${JSON.stringify(current.newValue)}`)
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

export class CurrentRunnerScope {
  hooks: (Hook | undefined)[] = []
  composes: any[] = [] // store the compose execute resutl

  outerListeners: Function[] = []
  stateChangeCallbackRunning = false
  stateChangeCallbackCancel = () => {}
  stateChangeWaitHooks: Set<Hook> = new Set<Hook>()
  watcher: Watcher<Hook> = new Watcher(this)
  initialArgList: any[] = []
  intialContextData: IHookContext['data'] | null = null
  intialContextDeps?: THookDeps
  initialHooksSet?: Set<number>
  hookRunnerName = ''

  intialCallHookIndex?: number

  reactiveChainStack: ReactiveChain[] = []

  // indicate can beleive the model data in context
  beleiveContext = false

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

  setInitialContextData(context: IHookContext) {
    this.intialContextData = context['data']
    if (context.index !== undefined && typeof context.index === 'number') {
      if (this.intialContextDeps?.length && context.index !== undefined) {
        const s = this.getRelatedHookIndexes(context.index)
        if (s.size !== 0) {
          this.initialHooksSet = s
        }
      }
    }
  }
  setInitialContextDeps(d?: THookDeps) {
    this.intialContextDeps = d
  }

  addHook(v: Hook | undefined) {
    if (v && this.hooks.indexOf(v) !== -1) {
      throw new Error('add repeat hook')
    }
    this.hooks.push(v)
    v && this.watcher.addDep(v)
  }

  applyDepsMap() {
    const deps = this.intialContextDeps
    deps?.forEach(([name, hookIndex, deps]) => {
      deps.forEach(triggerHookIndex => {
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

  appendComposeDeps(si: number, ei: number, deps?: THookDeps) {
    if (!deps) {
      return
    }
    const composeHooksLen = ei - si

    const modifiedDeps = (this.intialContextDeps || []).map(a => {
      const arr: THookDeps[0] = cloneDeep(a)

      if (arr[1] >= si) {
        arr[1] += composeHooksLen
      }
      if (arr[2]) {
        arr[2] = arr[2].map(v =>
          typeof v === 'number' && v >= si ? v + composeHooksLen : v
        )
      }
      if (arr[3]) {
        arr[3] = arr[3].map(v =>
          typeof v === 'number' && v >= si ? v + composeHooksLen : v
        )
      }
      return arr
    })

    this.intialContextDeps = modifiedDeps.concat(deps)
  }

  applyComputePatches(
    currentInputCompute: InputCompute,
    reactiveChain?: ReactiveChain
  ) {
    const hookModified = this.hooks.filter(h => {
      if (h && (h as State).inputComputePatchesMap) {
        return (h as State).inputComputePatchesMap.get(currentInputCompute)
      }
    })

    if (hookModified.length) {
      hookModified.forEach(h => {
        const newChildChain = reactiveChain?.add(h as State)
        ;(h as State).applyInputComputePatches(
          currentInputCompute,
          newChildChain
        )
      })
    }
  }

  /**
   * get all related hook index by curernet hookIndex
   * design logic:
   * 1.getD -> getD -> getD
   * 2.setD in who's getD -> getD
   */
  getRelatedHookIndexes(hookIndex: number) {
    let preventDeath = 0

    const waitHookIndexSet = new Set([hookIndex])
    const reachedHookIndexSet = new Set<number>()

    const deps = new Set<number>()

    if (waitHookIndexSet.size > 0) {
      for (const currentHookIndex of waitHookIndexSet) {
        if (preventDeath++ > 1e4 || reachedHookIndexSet.has(currentHookIndex)) {
          break
        }
        reachedHookIndexSet.add(currentHookIndex)

        this.intialContextDeps?.forEach(([name, hi, getD, setD]) => {
          if (hi === currentHookIndex) {
            // setD: to find who use hook in setD
            setD?.forEach(numOrArr => {
              let num: number = -1
              if (Array.isArray(numOrArr)) {
                const [type, composeIndex, variableName] = numOrArr
                if (type === 'c') {
                  const setterGetterFunc: { _hook: Hook } | undefined =
                    this.composes[composeIndex]?.[variableName]
                  if (setterGetterFunc?._hook) {
                    num = this.hooks.indexOf(setterGetterFunc._hook)
                  }
                }
              } else {
                num = numOrArr
              }
              if (num > -1) {
                waitHookIndexSet.add(num)
                deps.add(num)
                this.intialContextDeps?.forEach(([name, relationHI, getD2]) => {
                  if (getD2.includes(num)) {
                    deps.add(relationHI)
                    waitHookIndexSet.add(relationHI)
                  }
                })
              }
            })
            // getD: to find the hook directly
            getD?.forEach(numOrArr => {
              let num: number = -1
              if (Array.isArray(numOrArr)) {
                const [type, composeIndex, variableName] = numOrArr
                if (type === 'c') {
                  const setterGetterFunc: { _hook: Hook } | undefined =
                    this.composes[composeIndex]?.[variableName]
                  if (setterGetterFunc?._hook) {
                    num = this.hooks.indexOf(setterGetterFunc._hook)
                  }
                }
              } else {
                num = numOrArr
              }
              if (num > -1) {
                waitHookIndexSet.add(num)
                deps.add(num)
                this.intialContextDeps?.forEach(([name, relationHI, getD2]) => {
                  if (getD2.includes(num)) {
                    deps.add(relationHI)
                    waitHookIndexSet.add(relationHI)
                  }
                })
              }
            })
          }
        })
      }
    }

    return deps
  }
  /**
   * need deliver context principles, sort by priority:
   * 1.model/cache(server) needn't
   * 2.state
   * 3.related set/get
   */
  createInputComputeContext(h?: Hook, args?: any[]): IHookContext {
    const { hooks } = this
    const hookIndex = h ? hooks.indexOf(h) : -1

    let deps = new Set<number>()
    if (h) {
      deps = this.getRelatedHookIndexes(hookIndex)
    }
    const noDeps = deps.size === 0

    const hooksData: IHookContext['data'] = hooks.map((hook, i) => {
      if (noDeps || deps.has(i)) {
        // means: client -> server, doesn't need model, server must query again
        if (hook instanceof ClientModel) {
          return ['clientModel']
        }
        // means: server -> client
        if (hook instanceof Model) {
          return ['model', hook.value, hook.modifiedTimstamp]
        }
        if (hook instanceof Computed) {
          return ['computed', hook.value, hook.modifiedTimstamp]
        }
        if (hook instanceof Cache) {
          return ['cache', hook.value, hook.modifiedTimstamp]
        }
        if (hook instanceof InputCompute) {
          return ['inputCompute', null]
        }
        if (hook instanceof State) {
          return ['state', hook.value, hook.modifiedTimstamp]
        }
      }
      return ['unserialized']
    })

    return {
      initialArgList: this.initialArgList,
      name: this.hookRunnerName,
      data: hooksData,
      index: hookIndex === -1 ? undefined : hookIndex,
      args: args || []
    }
  }
  applyContextFromServer(c: IHookContext) {
    const contextData = c.data
    const { hooks } = this
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
            state.update?.(value, [], true)
            if (value && timestamp) {
              state.modifiedTimstamp = timestamp
            }
            break
        }
      }
    })
    this.notify()
  }

  get state() {
    const asyncHooks = this.hooks.filter(
      h => h && Reflect.has(h, 'getterPromise')
    ) as unknown as { getterPromise: Promise<any> | null }[]

    let notReadyHooks = asyncHooks
      .filter(h => {
        return !!h.getterPromise
      })
      .map(h => h.getterPromise)

    return notReadyHooks.length === 0 ? EScopeState.idle : EScopeState.pending
  }

  ready(): Promise<void> {
    const asyncHooks = this.hooks.filter(
      h => 
        h && Reflect.has(h, 'getterPromise') || 
        h instanceof AsyncInputCompute || 
        h instanceof AsyncState
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

let currentRunnerScope: CurrentRunnerScope | null = null

export class Runner<T extends Driver> {
  scope = new CurrentRunnerScope()
  alreadyInit = false
  options: { beleiveContext: boolean; runnerContext?: Symbol } = {
    beleiveContext: false
  }
  constructor(
    public driver: T,
    options?: { beleiveContext: boolean; runnerContext?: Symbol }
  ) {
    Object.assign(this.options, options)
    this.scope.beleiveContext = options?.beleiveContext
  }

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
    currentRunnerScope.setIntialArgs(
      args || [],
      this.driver.__name__ || this.driver.name
    )

    const deps = getDeps(this.driver)
    currentRunnerScope.setInitialContextDeps(deps)

    if (initialContext) {
      currentRunnerScope.setInitialContextData(initialContext)
      currentHookFactory = updateHookFactory
    } else {
      currentHookFactory = mountHookFactory
    }

    const result: ReturnType<T> = executeDriver(this.driver, args)

    // becase of some hook won't run at intitial time with initialContext
    if (initialContext) {
      this.scope.applyDepsMap()
    }

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
  state() {
    return this.scope.state
  }
  ready() {
    return this.scope.ready()
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
  if (currentComputedStack.length > 0) {
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
  cache: typeof mountCache
  computed: typeof mountComputed
  inputCompute: typeof inputCompute
  inputComputeInServer: typeof inputComputeInServer
  before: typeof before
  after: typeof after
  combineLatest: typeof combineLatest
} = updateHookFactory

function createStateSetterGetterFunc<SV>(s: State<SV>): {
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
          const reactiveChain: ReactiveChain<SV> | undefined =
            currentReactiveChain?.addUpdate(s)
          s.update(result, patches, false, reactiveChain)
        }
        return [result, patches]
      } else {
        throw new Error('[change state] pass a function')
      }
    }
    currentReactiveChain?.addCall(s)
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
        m.addInputComputePatches(result, patches)
      } else {
        const reactiveChain: ReactiveChain<T> | undefined =
          currentReactiveChain?.addUpdate(m)
        m.updateWithPatches(result, patches, reactiveChain)
      }
      return [result, patches]
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
          c.addInputComputePatches(result, patches)
        } else {
          const reactiveChain: ReactiveChain<SV> | undefined =
            currentReactiveChain?.addUpdate(c)
          c.update(result, patches, false, reactiveChain)
        }
        return [result, patches]
      } else {
        throw new Error('[change cache] pass a function')
      }
    }
    currentReactiveChain?.addCall(c)
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
function createUnaccessGetter2<T extends any[]>(index: number) {
  const f = (): any => {
    throw new Error(`[update getter] cant access un initialized hook(${index})`)
  }
  const newF = Object.assign(f, {
    _hook: null,
    exist: () => true,
    create: () => {},
    update: () => {},
    remove: () => {},
    refresh: () => {}
  })
  return newF
}

function updateState<T>(initialValue?: T) {
  const { hooks, initialHooksSet } = currentRunnerScope!
  const currentIndex = hooks.length
  const valid = !initialHooksSet || initialHooksSet.has(currentIndex)

  initialValue = currentRunnerScope!.intialContextData![currentIndex]?.[1]
  // undefined means this hook wont needed in this progress
  if (!valid) {
    currentRunnerScope!.addHook(undefined)
    return createUnaccessGetter<T>(currentIndex)
  }
  const timestamp = currentRunnerScope!.intialContextData![currentIndex]?.[2]
  const internalState = new State(initialValue)
  if (timestamp) {
    internalState.modifiedTimstamp = timestamp
  }

  const setterGetter = createStateSetterGetterFunc(internalState)
  currentRunnerScope!.addHook(internalState)

  const newSetterGetter = Object.assign(setterGetter, {
    _hook: internalState
  })

  return newSetterGetter
}

function mountState<T>(initialValue?: T) {
  const internalState = new State(initialValue)

  const setterGetter = createStateSetterGetterFunc(internalState)
  currentRunnerScope!.addHook(internalState)

  const newSetterGetter = Object.assign(setterGetter, {
    _hook: internalState
  })

  return newSetterGetter
}

function updateModel<T extends any[]>(
  e: string,
  q?: () => IModelQuery['query'] | void,
  op?: IModelOption
) {
  const { hooks, initialHooksSet } = currentRunnerScope!
  const currentIndex = hooks.length
  const valid = !initialHooksSet || initialHooksSet.has(currentIndex)

  if (!valid) {
    currentRunnerScope!.addHook(undefined)
    return createUnaccessGetter2<T>(currentIndex)
  }
  const inServer = process.env.TARGET === 'server'
  const { beleiveContext } = currentRunnerScope!

  const receiveDataFromContext = beleiveContext || !inServer

  op = Object.assign({}, op, {
    immediate: !receiveDataFromContext
  })

  const hook = inServer
    ? new Model<T>(e, q, op, currentRunnerScope!)
    : new ClientModel<T>(e, q, op, currentRunnerScope!)

  if (receiveDataFromContext) {
    const initialValue: T =
      currentRunnerScope!.intialContextData![currentIndex]?.[1]
    const timestamp = currentRunnerScope!.intialContextData![currentIndex]?.[2]
    hook.init = false
    hook._internalValue = initialValue || []
    if (timestamp) {
      hook.modifiedTimstamp = timestamp
    }
  }

  const setterGetter = createModelSetterGetterFunc<T>(hook)
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: hook,
    exist: hook.exist.bind(hook),
    create: hook.createRow.bind(hook),
    update: hook.updateRow.bind(hook),
    remove: hook.removeRow.bind(hook),
    refresh: hook.refresh.bind(hook)
  })

  return newSetterGetter
}
function mountModel<T extends any[]>(
  e: string,
  q?: () => IModelQuery['query'] | void,
  op?: IModelOption
) {
  const hook =
    process.env.TARGET === 'server'
      ? new Model<T>(e, q, op, currentRunnerScope!)
      : new ClientModel<T>(e, q, op, currentRunnerScope!)

  const setterGetter = createModelSetterGetterFunc<T>(hook)
  const newSetterGetter = Object.assign(setterGetter, {
    _hook: hook,
    exist: hook.exist.bind(hook),
    create: hook.createRow.bind(hook),
    update: hook.updateRow.bind(hook),
    remove: hook.removeRow.bind(hook),
    refresh: hook.refresh.bind(hook)
  })

  return newSetterGetter
}

function updateCache<T>(key: string, options: ICacheOptions<T>) {
  const { hooks, initialHooksSet } = currentRunnerScope!
  const currentIndex = hooks.length
  const valid = !initialHooksSet || initialHooksSet.has(currentIndex)

  if (!valid) {
    currentRunnerScope!.addHook(undefined)
    return createUnaccessGetter<T>(currentIndex)
  }

  /** @TODO cache maybe should has initial value */
  const hook = new Cache(key, options, currentRunnerScope!)

  const initialValue: T =
    currentRunnerScope!.intialContextData![currentIndex]?.[1]
  const timestamp = currentRunnerScope!.intialContextData![currentIndex]?.[2]

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
  const { hooks, initialHooksSet } = currentRunnerScope!
  const currentIndex = hooks.length
  const valid = !initialHooksSet || initialHooksSet.has(currentIndex)

  if (!valid) {
    currentRunnerScope!.addHook(undefined)
    return createUnaccessGetter<T>(currentIndex)
  }
  const initialValue: T =
    currentRunnerScope!.intialContextData![currentIndex]?.[1]
  const timestamp = currentRunnerScope!.intialContextData![currentIndex]?.[2]

  const hook = new Computed<T>(fn)
  currentRunnerScope!.addHook(hook)
  // @TODO: update computed won't trigger
  hook._internalValue = initialValue
  if (timestamp) {
    hook.modifiedTimstamp = timestamp
  }

  // const reactiveChain: ReactiveChain<T> | undefined =
  //   currentReactiveChain?.add(hook)
  // hook.run(reactiveChain)

  const getter = () => hook.value
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
  const hook = new Computed<T>(fn)
  currentRunnerScope!.addHook(hook)

  const reactiveChain: ReactiveChain<T> | undefined =
    currentReactiveChain?.add(hook)
  hook.run(reactiveChain)

  const getter = () => hook.value
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
  q?: () => IModelQuery['query'] | void,
  op?: IModelOption
) {
  if (!currentRunnerScope) {
    throw new Error('[model] must under a tarat runner')
  }
  return currentHookFactory.model<T>(e, q, op)
}

export function cache<T>(key: string, options: ICacheOptions<T>) {
  return currentHookFactory.cache<T>(key, options)
}

type FComputedFuncAsync<T, S = T extends Symbol ? undefined : T> = (
  prev?: T
) => Promise<S>
type FComputedFunc<T, S = T extends Symbol ? undefined : T> = (prev?: T) => S
type FComputedFuncGenerator<T, S = T extends Symbol ? undefined : T> = (
  prev?: T
) => Generator<unknown, S>

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

type InputComputeFn<T extends any[]> = (...arg: T) => void
type AsyncInputComputeFn<T extends any[]> = (...arg: T) => Promise<void>
type GeneratorInputComputeFn<T extends any[]> = (
  ...arg: T
) => Generator<unknown, void>

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

  const insideResult: ReturnType<T> = executeDriver(f, args)

  currentRunnerScope.composes.push(insideResult)

  const endIndex = currentRunnerScope.hooks.length

  const deps = getDeps(f)

  currentRunnerScope.appendComposeDeps(startIndex, endIndex, deps)

  return insideResult
}

/**
 * inject input data to Model as initial value
 */
type TModelGetter<T> = ReturnType<typeof model>
export function connectCreate<T>(
  modelGetter: TModelGetter<T>,
  dataGetter: TGetterData<T>
) {
  modelGetter._hook.addCreateGetter(dataGetter)
}


interface IGetterPromise<T> {
  getterPromise: Promise<T>
}

export function progress<T = any> (getter: { _hook: AsyncState<T> | AsyncInputCompute<T[]> }) {
  const hook = getter._hook
  return () => ({
    state: hook.init ? EScopeState.init : hook.getterPromise ? EScopeState.pending : EScopeState.idle
  })
}