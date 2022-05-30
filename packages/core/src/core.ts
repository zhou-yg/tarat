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
  TPath
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
  notify: (hook?: T) => void
}

interface ISource<U> {
  watchers: Set<Watcher<U>>
  addWatcher: (w: Watcher<U>) => void
}

class Watcher<T> {
  deps: Map<ISource<T>, (string | number)[][]> = new Map()
  constructor(public target: ITarget<ISource<T>>) {}
  notify(dep: ISource<T>, path: TPath) {
    const paths = this.deps.get(dep)
    const matched = paths?.some(p => isEqual(p, path))
    if (matched) {
      this.target.notify(dep)
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

class Hook {
  freezed?: boolean
  watchers = new Set<Watcher<typeof this>>()
  addWatcher(w: Watcher<Hook>) {
    this.watchers.add(w)
  }
}

class State<T = any> extends Hook {
  _internalValue: T
  freezed?: boolean
  constructor(data: T) {
    super()
    this._internalValue = data
  }
  trigger(path: (number | string)[] = ['']) {
    if (path.length === 0) {
      path = ['']
    }
    this.watchers.forEach(w => {
      w.notify(this, path)
    })
  }
  get value(): T {
    return internalProxy(this, this._internalValue)
  }
  update(v: T, patches: IPatch[] = []) {
    const oldValue = this._internalValue
    this._internalValue = v
    if (patches.length === 0) {
      this.trigger()
    } else {
      const changedPathArr = calculateChangedPath(oldValue, patches)
      changedPathArr.forEach(path => this.trigger(path))
    }
  }
  // @TODO, lots of case should be upgrade
  applyPatches(p: IPatch[]) {
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

class Model<T> extends State<T | undefined> {
  constructor(
    public getQueryWhere: () => IModelQuery,
    public options: IModelOption = {}
  ) {
    super(undefined)
    if (options.immediate) {
      this.query()
    }
  }
  async query() {
    const q = this.getQueryWhere()
    const result = await getModelFind()(q.entity, q.where)
    if (this.options.unique) {
      this.updateFromRemote(result[0])
    } else {
      this.updateFromRemote(result)
    }
  }
  updateFromRemote(v: T) {
    this._internalValue = v
    this.trigger()
  }
  async updateWithPatches(v: T | undefined, patches: IPatch[]) {
    const oldValue = this._internalValue
    if (!this.options.pessimisticUpdate) {
      this.update(v, patches)
    }

    const { entity } = this.getQueryWhere()
    try {
      const diff = calculateDiff(oldValue, patches)
      await getDiffExecution()(entity, diff)
    } catch (e) {
      console.error('[updateWithPatches] postPatches fail')
      if (this.options.autoRollback) {
        this.update(oldValue)
      }
    }
    await this.query()
  }
}

class ClientModel<T = any> extends Model<T> {
  async updateWithPatches(v: T, patches: IPatch[]) {
    this.update(v)
    const { entity } = this.getQueryWhere()
    const diff = calculateDiff(v, patches)
    await getPostDiffToServer()(entity, diff)
    await this.query()
  }
}

class Computed<T> extends State<T | undefined> {
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
    if (r.then || r instanceof Promise) {
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
  inputFuncEnd() {
    currentInputeCompute = null
    this.scope.applyComputePatches()
    unFreeze({ _hook: this })
    this.triggerEvent('after')
  }
  run(...args: any) {
    currentInputeCompute = this
    this.triggerEvent('before')
    if (!checkFreeze({ _hook: this })) {
      const funcResult = this.getter(...args)
      if (isPromise(funcResult)) {
        return Promise.resolve(funcResult).then(() => {
          this.inputFuncEnd()
        })
      }
      this.getter(...args)
    }
    this.inputFuncEnd()
  }
  async runInServer(...args: any) {
    currentInputeCompute = this
    this.triggerEvent('before')
    if (!checkFreeze({ _hook: this })) {
      const context = this.scope.createInputComputeContext(this, args)
      const result = await getModelConfig().postComputeToServer(context)
      this.scope.applyContext(result)
    }
    this.inputFuncEnd()
  }
  triggerEvent(timing: 'before' | 'after') {
    this.watchers.forEach(w => {
      w.notify(this, [timing])
    })
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
  applyComputePatches() {
    const dataWithPatches = this.computePatches
    this.computePatches = []

    dataWithPatches.forEach(([d, p]) => {
      d.applyPatches(p)
    })
  }

  createInputComputeContext(h: Hook, args: any): IHookContext {
    const { hooks } = this
    const hookIndex = hooks.indexOf(h)
    const hooksData: IHookContext['data'] = hooks.map(hook => {
      if (hook instanceof State) {
        return ['data', hook.value]
      }
      return ['inputCompute', null]
    })
    return {
      data: hooksData,
      index: hookIndex,
      args
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

export type IHookContextData = IHookContext['data']

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

    const result: ReturnType<BM> = executeBM(this.bm, args)
    if (this.initialContext) {
      currentRunnerScope.applyContext(this.initialContext)
    }
    currentRunnerScope = null

    this.alreadInit = true

    return result
  }
  async callHook(hookIndex: number, arg: any) {
    const hook = this.scope.hooks[hookIndex]
    if (hook) {
      await (hook as InputCompute).run(arg)
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

function internalProxy<T>(
  source: State<T>,
  _internalValue: T,
  path: (string | number)[] = []
): T {
  if (currentComputed) {
    currentComputed.watcher.addDep(source, path)
    if (_internalValue && likeObject(_internalValue)) {
      return new Proxy(_internalValue as any, {
        get(target, p: string) {
          return internalProxy(source, (target as any)[p], path.concat(p))
        }
      })
    }
  }
  return _internalValue
}

let currentInputeCompute: Hook | null = null

type IModifyFunction<T> = (draft: Draft<T>) => void

interface FStateSetterGetterFunc<SV = any> extends Function {
  (arg?: IModifyFunction<SV>): SV
  _hook?: Hook
}

function createStateSetterGetterFunc<SV>(
  s: State<SV>,
  scope: CurrentRunnerScope
): FStateSetterGetterFunc<SV> {
  return paramter => {
    if (paramter) {
      if (isFunc(paramter)) {
        if (currentInputeCompute) {
          const [result, patches] = produceWithPatches(s.value, paramter)

          scope.addComputePatches(s, patches)
        } else {
          const [result, patches] = produceWithPatches(s.value, paramter)
          s.update(result, patches)
        }
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
): FStateSetterGetterFunc<T | undefined> {
  return (paramter?: IModifyFunction<T>) => {
    if (paramter && isFunc(paramter)) {
      const [result, patches] = produceWithPatches(m.value, paramter)

      if (currentInputeCompute) {
        scope.addComputePatches(m, patches)
      } else {
        m.updateWithPatches(result, patches)
      }
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

interface FInputComputeFunc extends Function {
  (...args: any): void
  _hook?: Hook
}

export function state<S>(initialValue: S): FStateSetterGetterFunc<S> {
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
export function model<T>(
  q: () => IModelQuery,
  op?: IModelOption
): FStateSetterGetterFunc<T | undefined> {
  if (!currentRunnerScope) {
    throw new Error('[model] must under a tarot runner')
  }

  const internalModel = getEnv().client
    ? new ClientModel<T>(q, op)
    : new Model<T>(q, op)

  const setterGetter = createModelSetterGetterFunc<T>(
    internalModel,
    currentRunnerScope
  )
  currentRunnerScope.addHook(internalModel)
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

export function inputComputeServer<T>(func: InputComputeFn) {
  if (!currentRunnerScope) {
    throw new Error('[inputComputeServer] must under a tarot runner')
  }

  const hook = new InputCompute(func, currentRunnerScope)

  const wrapFunc: FInputComputeFunc = (...args: any) => {
    hook.runInServer(...args)
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
