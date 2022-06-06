import {
  calculateDiff,
  getDiffExecution,
  getModelFind,
  IModelQuery,
  IPatch,
  isFunc,
  map,
  getPostDiffToServer,
  getEnv,
  isAsyncFunc,
  getModelConfig,
  IHookContext,
  isDef,
  likeObject,
  isPromise,
  nextTick,
  get,
  set,
  traverseValues,
  calculateChangedPath,
  isEqual,
  TPath,
  shallowCopy
} from './util'
import {
  produceWithPatches,
  produce,
  Draft,
  enablePatches,
  applyPatches
} from 'immer'

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

export class Watcher<T> {
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
    return internalProxy(this, this._internalValue)
  }
  update(v: T, patches?: IPatch[]) {
    const oldValue = this._internalValue
    this._internalValue = v

    this.trigger()

    if (patches && patches.length > 0) {
      const changedPathArr = calculateChangedPath(oldValue, patches)
      changedPathArr.forEach(path => this.trigger(path, patches))
    }
  }
  // @TODO should be upgrade for some badcase maybe
  applyPatches(p: IPatch[]) {
    console.log('[state.applyPatches]', p)
    if (likeObject(this._internalValue)) {
      const newValue = applyPatches(this._internalValue!, p)
      this.update(newValue)
    } else if (isDef(this._internalValue)) {
      const newValue = applyPatches(this._internalValue!, p)
      this.update(newValue)
    } else {
      const v = p[p.length - 1]?.value
      this.update(v)
    }
  }
}

export class Model<T> extends State<T | undefined> {
  constructor(
    public getQueryWhere: () => IModelQuery,
    public options: IModelOption = {},
    public scope: CurrentRunnerScope
  ) {
    super(undefined)
    scope.addHook(this)
    if (options.immediate) {
      this.query()
    }
  }
  async query() {
    const q = this.getQueryWhere()
    console.log('[model.query] q.entity, q.query: ', q.entity, q.query)
    const result = await getModelFind()(q.entity, q.query)
    console.log('[model.query] result: ', result)
    if (this.options.unique) {
      this.update(result[0])
    } else {
      this.update(result)
    }
  }
  override async applyPatches(patches: IPatch[]) {
    if (this._internalValue) {
      const newValue = applyPatches(this._internalValue, patches)
      console.log('[model.applyPatches]', newValue, Object.isFrozen(newValue))
      await this.updateWithPatches(newValue, patches)
    }
  }
  async updateWithPatches(v: T | undefined, patches: IPatch[]) {
    const oldValue = this._internalValue
    if (!this.options.pessimisticUpdate) {
      console.log('[Model.updateWithPatches] update internal')
      this.update(v, patches)
    }

    const { entity } = this.getQueryWhere()
    try {
      const diff = calculateDiff(oldValue, patches)
      console.log('[Model.updateWithPatches] diff: ', diff)
      await getDiffExecution()(entity, diff)
    } catch (e) {
      console.error('[updateWithPatches] postPatches fail', e)
      if (this.options.autoRollback) {
        this.update(oldValue)
      }
    }
    await this.query()
  }
}

class ClientModel<T = any> extends Model<T> {
  override async query() {
    const context = this.scope.createInputComputeContext(this)
    const result = await getModelConfig().postQueryToServer(context)
    this.scope.applyContext(result)
  }
  override async updateWithPatches(v: T, patches: IPatch[]) {
    const oldValue = this._internalValue
    if (!this.options.pessimisticUpdate) {
      this.update(v, patches)
    }
    // cal diff
    const { entity } = this.getQueryWhere()
    const diff = calculateDiff(oldValue, patches)
    await getPostDiffToServer()(entity, diff)
    await this.query()
  }
}

export class Computed<T> extends State<T | undefined> {
  getterPromise: Promise<T> | null = null
  batchRunCancel: () => void = () => {}
  watcher: Watcher<State<any>> = new Watcher<State<any>>(this)
  constructor(public getter: FComputedFunc<T>) {
    super(undefined)
  }
  run() {
    currentComputed = this
    const r: any = this.getter()
    currentComputed = null
    if (r && (r.then || r instanceof Promise)) {
      r.then((asyncResult: T) => {
        this.update(asyncResult)
      })
    } else {
      this.update(r)
    }
  }
  notify() {
    this.batchRunCancel()
    this.batchRunCancel = nextTick(() => {
      this.run()
    })
  }
}
class InputCompute extends Hook {
  constructor(public getter: InputComputeFn, public scope: CurrentRunnerScope) {
    super()
    scope.addHook(this)
  }
  inputFuncStart() {}
  async inputFuncEnd() {
    console.log('inputFuncEnd: ')
    currentInputeCompute = null
    await this.scope.applyComputePatches()
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
class InputComputeClient extends InputCompute {
  async run(...args: any[]) {
    currentInputeCompute = this
    this.triggerEvent('before')
    if (!checkFreeze({ _hook: this })) {
      const context = this.scope.createInputComputeContext(this, args)
      const result = await getModelConfig().postComputeToServer(context)
      this.scope.applyContext(result)
    }
    this.inputFuncEnd()
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

export class CurrentRunnerScope {
  hooks: Hook[] = []
  computePatches: Array<[State, IPatch[]]> = []
  outerListeners: Function[] = []
  stateChangeCallbackRunning = false
  stateChangeCallbackCancel = () => {}
  stateChangeWaitHooks: Set<Hook> = new Set<Hook>()
  watcher: Watcher<Hook> = new Watcher(this)
  initialArgList: any[] = []
  hookRunnerName = ''
  constructor() {}
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

  addHook(v: Hook) {
    if (this.hooks.indexOf(v) !== -1) {
      throw new Error('add repeat hook')
    }
    this.hooks.push(v)
    this.watcher.addDep(v)
  }

  addComputePatches(data: State, p: IPatch[]) {
    let exist = this.computePatches.find(arr => arr[0] === data)
    if (!exist) {
      exist = [data, []]
      this.computePatches.push(exist)
    }
    exist[1] = exist[1].concat(p)
  }
  async applyComputePatches() {
    const dataWithPatches = this.computePatches
    console.log('dataWithPatches: ', dataWithPatches)
    this.computePatches = []

    await Promise.all(
      dataWithPatches.map(([d, p]) => {
        return d.applyPatches(p)
      })
    )
  }

  createInputComputeContext(h?: Hook, args?: any[]): IHookContext {
    const { hooks } = this
    console.log('[createInputComputeContext] hooks: ', hooks)
    const hookIndex = h ? hooks.indexOf(h) : -1
    const hooksData: IHookContext['data'] = hooks.map(hook => {
      if (hook instanceof State) {
        return ['data', hook.value]
      }
      return ['inputCompute', null]
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
          case 'data':
            state.update(value)
            break
          case 'patch':
            {
              const newValue = applyPatches(state.value, value)
              state.update(newValue)
            }
            break
        }
      }
    })
  }
}

type BM = (...prop: any) => any

let currentRunnerScope: CurrentRunnerScope | null = null

export class Runner {
  scope = new CurrentRunnerScope()
  alreadInit = false
  constructor(public bm: BM, public initialContext?: IHookContext) {}
  onUpdate(f: Function) {
    return this.scope?.onUpdate(() => {
      f()
    })
  }
  init(...args: any) {
    if (this.alreadInit) {
      throw new Error('can not init repeat')
    }
    currentRunnerScope = this.scope
    currentRunnerScope.setIntialArgs(args, this.bm.name)

    const result: ReturnType<BM> = executeBM(this.bm, args)
    if (this.initialContext) {
      currentRunnerScope.applyContext(this.initialContext)
    }
    currentRunnerScope = null

    this.alreadInit = true

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
        await (hook as Model<any>).query()
      } else {
        await (hook as InputCompute).run(...args)
      }
    }
  }
}

function executeBM(f: BM, args: any) {
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

let currentInputeCompute: Hook | null = null

type IModifyFunction<T> = (draft: Draft<T>) => void

function createStateSetterGetterFunc<SV>(
  s: State<SV>,
  scope: CurrentRunnerScope
): {
  (): SV
  (paramter: IModifyFunction<SV>): [SV, IPatch[]]
} & { _hook?: Hook } {
  return (paramter?: any): any => {
    if (paramter) {
      if (isFunc(paramter)) {
        const [result, patches] = produceWithPatches(s.value, paramter)
        if (currentInputeCompute) {
          scope.addComputePatches(s, patches)
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
}

function createModelSetterGetterFunc<T>(
  m: Model<T>,
  scope: CurrentRunnerScope
): {
  (): T | undefined
  (paramter: IModifyFunction<T | undefined>): [T | undefined, IPatch[]]
} & { _hook?: Hook } {
  return (paramter?: any): any => {
    if (paramter && isFunc(paramter)) {
      const [result, patches] = produceWithPatches(m.value, paramter)
      console.log(
        '[model setter] result, patches: ',
        !!currentInputeCompute,
        JSON.stringify(patches, null, 2)
      )

      if (currentInputeCompute) {
        scope.addComputePatches(m, patches)
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

type InputComputeFn = (...arg: any) => void | Promise<void>

type FComputedFunc<T> = () => T | Promise<T>

interface FComputedGetterFunc<T> extends Function {
  (): T
  _hook?: State<T>
}
let currentComputed: null | Computed<any> = null

export function setCurrentComputed(c: Computed<any> | null) {
  currentComputed = c
}

interface FInputComputeFunc extends Function {
  (...args: any): void
  _hook?: Hook
}

export function state<S>(initialValue: S) {
  if (!currentRunnerScope) {
    throw new Error('[state] must under a tarot runner')
  }

  const internalState = new State(initialValue)

  const setterGetter = createStateSetterGetterFunc(
    internalState,
    currentRunnerScope
  )
  currentRunnerScope.addHook(internalState)

  setterGetter._hook = internalState

  return setterGetter
}
export function model<T>(q: () => IModelQuery, op?: IModelOption) {
  if (!currentRunnerScope) {
    throw new Error('[model] must under a tarot runner')
  }

  const internalModel =
    process.env.TARGET === 'server'
      ? new Model<T>(q, op, currentRunnerScope)
      : new ClientModel<T>(q, op, currentRunnerScope)

  const setterGetter = createModelSetterGetterFunc<T>(
    internalModel,
    currentRunnerScope
  )
  setterGetter._hook = internalModel

  return setterGetter
}
export function modelClient<T>(q: () => IModelQuery, op?: IModelOption) {
  if (!currentRunnerScope) {
    throw new Error('[model] must under a tarot runner')
  }

  const internalModel = new ClientModel<T>(q, op, currentRunnerScope)

  const setterGetter = createModelSetterGetterFunc<T>(
    internalModel,
    currentRunnerScope
  )
  setterGetter._hook = internalModel

  return setterGetter
}
export function computed<T>(fn: FComputedFunc<T>) {
  const hook = new Computed(fn)
  currentComputed = hook
  currentRunnerScope!.addHook(hook)

  hook.run()

  currentComputed = null

  const getter: FComputedGetterFunc<T | undefined> = () => hook.value
  getter._hook = hook
  return getter
}

export function inputCompute<T>(func: InputComputeFn) {
  if (!currentRunnerScope) {
    throw new Error('[inputCompute] must under a tarot runner')
  }

  const hook = new InputCompute(func, currentRunnerScope)

  const wrapFunc: FInputComputeFunc = (...args: any) => {
    return hook.run(...args)
  }
  wrapFunc._hook = hook
  return wrapFunc
}

export function inputComputeClient<T>(func: InputComputeFn) {
  if (!currentRunnerScope) {
    throw new Error('[inputComputeServer] must under a tarot runner')
  }
  /**
   * running in client should post request to server
   * if already in server, should execute directly
   */
  if (process.env.TARGET === 'server') {
    return inputCompute<T>(func)
  }

  const hook = new InputComputeClient(func, currentRunnerScope)

  const wrapFunc: FInputComputeFunc = (...args: any) => {
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
