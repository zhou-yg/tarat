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
  nextTick
} from './util'
import {
  produceWithPatches,
  produce,
  Draft,
  enablePatches,
  applyPatches
} from 'immer'

enablePatches()

type IScopeHook = State | InputComputeHook

export function freeze(target: { freezed?: boolean }) {
  target.freezed = true
}
function unFreeze(target: { freezed?: boolean }) {
  target.freezed = false
}
function checkFreeze(target: { freezed?: boolean }) {
  return target.freezed === true
}

class CurrentRunnerScope {
  dataSetterGetterMap = new Map<FDataSetterGetterFunc, State>()
  hooks: IScopeHook[] = []
  computePatches: Array<[State, IPatch[]]> = []
  internalListeners: Array<
    [
      IScopeHook,
      {
        before: Function[]
        after: Function[]
      }
    ]
  > = []
  outerListeners: Function[] = []
  stateChangeCallbackRunning = false
  stateChangeCallbackCancel = () => {}
  stateChangeWaitHooks: Array<IScopeHook> = []
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
  stateChanged(s: IScopeHook, v?: any) {
    this.stateChangeWaitHooks.push(s)
    if (this.stateChangeCallbackRunning) {
      return
    }
    this.batchRunInternalCallbacks()
  }
  batchRunInternalCallbacks() {
    this.stateChangeCallbackCancel()
    this.stateChangeCallbackCancel = nextTick(() => {
      this.stateChangeCallbackRunning = true
      const changedHooks = this.stateChangeWaitHooks
      this.stateChangeWaitHooks = []

      const callbackSet = new Set<Function>()

      let hasStateHookChanged = false

      changedHooks.forEach(s => {
        this.internalListeners.forEach(([s2, listener]) => {
          if (s2 === s && listener?.after) {
            listener.after.forEach(f => callbackSet.add(f))
          }
        })
        hasStateHookChanged = s instanceof State || hasStateHookChanged
      })
      for (const f of callbackSet) {
        f()
      }
      if (hasStateHookChanged) {
        this.notifyOuter()
      }
      this.stateChangeCallbackRunning = false
    })
  }

  addHook(v: IScopeHook, f?: FDataSetterGetterFunc) {
    this.hooks.push(v)

    if (v instanceof State) {
      v.onUpdate(this.stateChanged.bind(this, v))
      this.dataSetterGetterMap.set(f!, v)
    }
  }

  addWatch(hook: IScopeHook, fn: () => void, timing: 'before' | 'after') {
    let hookWithListeners = this.internalListeners.find(arr => arr[0] === hook)
    if (!hookWithListeners) {
      hookWithListeners = [
        hook,
        {
          before: [],
          after: []
        }
      ]
      this.internalListeners.push(hookWithListeners)
    }
    if (timing === 'before') {
      hookWithListeners[1].before.push(fn)
    } else if (timing === 'after') {
      hookWithListeners[1].after.push(fn)
    }
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
  beforeInputCompute(h: InputComputeHook) {
    this.internalListeners.forEach(([v, listener]) => {
      if (v === h) {
        listener.before.forEach(f => f(h))
      }
    })
  }
  afterInputCompute(h: InputComputeHook) {
    this.stateChanged(h)
  }
  createInputComputeContext(h: InputComputeHook, args: any): IHookContext {
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
    if (isFunc(hook)) {
      await (hook as InputComputeFn)(arg)
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

type IStateListener<T = any> = (v: T) => void

export class State<T = any> {
  _internalValue: T | undefined
  listeners: IStateListener[] = []
  freezed?: boolean
  constructor(data?: T) {
    this._internalValue = data
  }
  notify() {
    this.listeners.forEach(f => f(this._internalValue))
  }
  onUpdate(fn: IStateListener<T>) {
    if (this.listeners.indexOf(fn) === -1) {
      this.listeners.push(fn)
    }
    return () => this.offUpdate(fn)
  }
  offUpdate(fn?: IStateListener) {
    if (fn) {
      this.listeners = this.listeners.filter(f => f !== fn)
    } else {
      this.listeners = []
    }
  }
  get value() {
    return this._internalValue
  }
  update(v?: T) {
    this._internalValue = v
    this.notify()
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

let currentInputeCompute: InputComputeFn | null = null

type IModifyFunction<T> = (draft: Draft<T>) => void

function createStateSetterGetterFunc<T = any>(
  s: State<T>,
  scope: CurrentRunnerScope
): (arg?: IModifyFunction<T>) => T | undefined {
  return paramter => {
    if (paramter) {
      if (isFunc(paramter)) {
        if (currentInputeCompute) {
          const [result, patches] = produceWithPatches(s.value, paramter)

          scope.addComputePatches(s, patches)
        } else {
          const result = produce(s.value, paramter)
          s.update(result)
        }
      } else {
        throw new Error('[change state] pass a function')
      }
    }
    return s.value
  }
}

type FStateSetterGetterFunc = ReturnType<typeof createStateSetterGetterFunc>

interface IModelOption {
  immediate?: boolean
  unique?: boolean
  autoRollback?: boolean
  pessimisticUpdate?: boolean
}

class Model<T = any> extends State<T> {
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
    this.notify()
  }
  async updateWithPatches(v: T | undefined, patches: IPatch[]) {
    const oldValue = this._internalValue
    if (!this.options.pessimisticUpdate) {
      this.update(v)
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

export function state<T>(initialValue: T): FStateSetterGetterFunc {
  if (!currentRunnerScope) {
    throw new Error('[state] must under a tarot runner')
  }

  const internalState = new State<T>(initialValue)

  const setterGetter = createStateSetterGetterFunc<T>(
    internalState,
    currentRunnerScope
  )
  currentRunnerScope.addHook(internalState, setterGetter)

  return setterGetter
}

function createModelSetterGetterFunc<T>(
  m: Model<T>,
  scope: CurrentRunnerScope
) {
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

type FModelSetterGetterFunc = ReturnType<typeof createStateSetterGetterFunc>

type FDataSetterGetterFunc = FStateSetterGetterFunc | FModelSetterGetterFunc

export function model<T = any>(
  q: () => IModelQuery,
  op?: IModelOption
): FModelSetterGetterFunc {
  if (!currentRunnerScope) {
    throw new Error('[model] must under a tarot runner')
  }

  const internalModel = getEnv().client
    ? new ClientModel(q, op)
    : new Model(q, op)

  const setterGetter = createModelSetterGetterFunc<T>(
    internalModel,
    currentRunnerScope
  )
  currentRunnerScope.addHook(internalModel, setterGetter)
  return setterGetter
}

function isInputCompute(v: any) {
  return v.__inputComputeTag
}

type InputComputeFn = (...arg: any) => void | Promise<void>

interface InputComputeHook extends Function {
  (...arg: any): void | Promise<void>
  freezed?: boolean
}

function inputFuncEnd<T>(hook: InputComputeHook, scope: CurrentRunnerScope) {
  currentInputeCompute = null
  scope.applyComputePatches()
  scope.afterInputCompute(hook)
  unFreeze(hook)
}

function createInputComputeExecution<T>(
  func: InputComputeFn,
  scope: CurrentRunnerScope
) {
  const hook: InputComputeHook = (...args: any) => {
    scope.beforeInputCompute(hook)
    currentInputeCompute = func
    if (!checkFreeze(hook)) {
      const funcResult = func(...args)
      if (isPromise(funcResult)) {
        return Promise.resolve(funcResult).then(() => {
          inputFuncEnd(hook, scope)
        })
      }
      func(...args)
    }
    inputFuncEnd(hook, scope)
  }

  return hook
}

function createServerInputComputeExecution<T>(
  func: InputComputeFn,
  scope: CurrentRunnerScope
) {
  const hook: InputComputeHook = async (...args: T[]) => {
    scope.beforeInputCompute(hook)
    currentInputeCompute = hook
    if (!checkFreeze(hook)) {
      const context = scope.createInputComputeContext(hook, args)
      const result = await getModelConfig().postComputeToServer(context)
      scope.applyContext(result)
    }
    currentInputeCompute = null
    scope.applyComputePatches()
    scope.afterInputCompute(hook)
    unFreeze(hook)
  }

  return hook
}

export function inputCompute<T>(func: InputComputeFn) {
  if (!currentRunnerScope) {
    throw new Error('[inputCompute] must under a tarot runner')
  }
  const wrapCompute = createInputComputeExecution(func, currentRunnerScope)
  currentRunnerScope.addHook(wrapCompute)

  return wrapCompute
}

export function inputComputeServer<T>(func: InputComputeFn) {
  if (!currentRunnerScope) {
    throw new Error('[inputComputeServer] must under a tarot runner')
  }

  const wrapCompute = createServerInputComputeExecution(
    func,
    currentRunnerScope
  )
  currentRunnerScope.addHook(wrapCompute)

  return wrapCompute
}

type IWatchTarget = FDataSetterGetterFunc | InputComputeFn

export function after(callback: () => void, targets: IWatchTarget[]) {
  const fn = () => {
    callback()
  }
  targets.forEach(hook => {
    const realHook = currentRunnerScope!.dataSetterGetterMap.get(
      hook as FDataSetterGetterFunc
    )
    if (realHook) {
      currentRunnerScope!.addWatch(realHook, fn, 'after')
    } else if (typeof hook === 'function') {
      currentRunnerScope!.addWatch(hook as InputComputeFn, fn, 'after')
    }
  })
}

export function before(callback: () => void, targets: IWatchTarget[]) {
  const fn = () => {
    callback()
  }
  targets.forEach(hook => {
    const realHook = currentRunnerScope!.dataSetterGetterMap.get(
      hook as FDataSetterGetterFunc
    )
    // TIP：useless, because can't before state changed
    if (realHook) {
      currentRunnerScope!.addWatch(realHook, fn, 'before')
    } else if (typeof hook === 'function') {
      currentRunnerScope!.addWatch(hook as InputComputeFn, fn, 'before')
    }
  })
}
