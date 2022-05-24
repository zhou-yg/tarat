import {
  calculateDiff,
  getExecuteDiff,
  getModelFind,
  IModelQuery,
  IPatch,
  isFunc,
  map,
  getPostDiffToServer,
  getEnv,
  isAsyncFunc,
  getModelConfig,
  IHookContext
} from './util'
import {
  produceWithPatches,
  produce,
  Draft,
  enablePatches,
  applyPatches,

} from 'immer'

type IScopeHook = State | InputComputeFn

export function freeze (target: { freezed?: boolean }) {
  target.freezed = true
}
function unFreeze (target: { freezed?: boolean }) {
  target.freezed = false
}
function checkFreeze (target: { freezed?: boolean }) {
  return target.freezed === true
}

class CurrentRunnerScope {
  hooks: IScopeHook[] = []
  computePatches: Array<[State, IPatch[]]> = []
  internalListeners: Array<[IScopeHook, {
    before: Function[]
    after: Function[]
  }]> = []
  outerListeners: Function[] = []
  constructor () {
  }
  onUpdate (f: Function) {
    this.outerListeners.push(f)
    return () => {
      this.outerListeners = this.outerListeners.filter(_ => _ !== f)
    }
  }
  stateChanged (s: State, v: any) {
    this.internalListeners.forEach(([s2, listener]) => {
      if (s2 === s) {
        listener?.after?.forEach(f2 => f2(v))
      }
    })
  }

  addHook (v: IScopeHook) {
    this.hooks.push(v)

    if (v instanceof State) {
      v.onUpdate(this.stateChanged.bind(this, v))
    }
  }

  addWatch (hook: IScopeHook, fn: () => void, timing: 'before' | 'after') {
    let hookWithListeners = this.internalListeners.find(arr => arr[0] === hook)
    if (!hookWithListeners) {
      hookWithListeners = [hook, {
        before: [],
        after: []
      }]
      this.internalListeners.push(hookWithListeners)
    }
    if (timing === 'before') {
      hookWithListeners[1].before.push(fn)
    } else if (timing === 'after') {
      hookWithListeners[1].after.push(fn)
    }
  }

  addComputePatches (data: State, p: IPatch[]) {
    this.computePatches.push(
      [data, p]
    )
  }
  applyComputePatches () {
    const dataWithPatches = this.computePatches
    this.computePatches = []

    dataWithPatches.forEach(([d, p]) => {
      d.applyPatches(p)
    })
  }
  beforeInputCompute (func: InputComputeFn) {
    this.internalListeners.forEach(([v, listener]) => {
      if (v === func) {
        listener.before.forEach(f => f(func))
      }
    })
  }
  afterInputCompute (func: InputComputeFn) {
    this.internalListeners.forEach(([v, listener]) => {
      if (v === func) {
        listener.after.forEach(f => f(func))
      }
    })
  }
  createInputComputeContext (func: InputComputeFn, arg: any): IHookContext {
    const { hooks } = this
    const hookIndex = hooks.indexOf(func)
    const hooksData: IHookContext['data'] = hooks.map(hook => {
      if (hook instanceof State) {
        return [
          'data',
          Object.assign(hook.value)
        ]
      }
      return null
    })
    return {
      data: hooksData,
      index: hookIndex,
      args: arg
    }
  }
  applyContext (c: IHookContext['data']) {
    const { hooks } = this
    c.forEach(([type, value], index) => {
      if (value) {
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


type BM = (prop?: any) => any

let currentRunnerScope: CurrentRunnerScope | null = null

export class Runner {
  scope = new CurrentRunnerScope()
  constructor (
    public bm: BM
  ) {
  }
  onUpdate (f: Function) {
    return this.scope.onUpdate(() => {
      f()
    })
  }
  init (args: any, initialContext?: IHookContext['data']) {
    if (this.scope) {
      throw new Error('can not init repeat')
    }
    currentRunnerScope = this.scope
    
    const result: ReturnType<BM> = executeBM(this.bm, args)
    if (initialContext) {
      currentRunnerScope.applyContext(initialContext)
    }
    currentRunnerScope = null

    return result
  }
  async callHook (hookIndex: number, arg: any) {
    const hook = this.scope.hooks[hookIndex]
    if (isFunc(hook)) {
      await (hook as InputComputeFn)(arg)
    }
  }
}


function executeBM (f: BM, args: any) {
  const bmResult = f(args)

  if (bmResult) {
    map(bmResult, (v) => {
      if (v instanceof State) {
        
      } else if (v instanceof Model) {

      } else if (isInputCompute(v)) {

      }
    })
  }

  return bmResult
}

type IStateListener<T = any> = (v: T) => void

class State<T = any> {
  _internalValue: T = undefined
  listeners: IStateListener[] = []
  freezed?: boolean
  constructor (data: T) {
    this._internalValue = data
  }
  notify () {
    this.listeners.forEach(f => f(this._internalValue))
  }
  onUpdate (fn: IStateListener<T>) {
    if (this.listeners.indexOf(fn) === -1) {
      this.listeners.push(fn)
    }
    return () => this.offUpdate(fn)
  }
  offUpdate (fn?: IStateListener) {
    if (fn) {
      this.listeners = this.listeners.filter(f => f !== fn)
    } else {
      this.listeners = []
    }
  }
  get value () {
    return this._internalValue
  }
  update (v: T) {
    this._internalValue = v
    this.notify()
  }
  applyPatches (p: IPatch[]) {
    const newValue = applyPatches(this._internalValue, p)
    this.update(newValue)
  }
}

let currentInputeCompute: Function = null

type IModifyFunction<T> = (draft: Draft<T>) => void


function createStateSetterFunc<T>(s: State<T>, scope: CurrentRunnerScope) {
  return (paramter?: IModifyFunction<T>) => {
    if (isFunc(paramter)) {
      if (currentInputeCompute) {
        const [result, patches] = produceWithPatches(s.value, paramter)

        scope.addComputePatches(s, patches)
      } else {
        const result = produce(s.value, paramter)
        s.update(result)
      }
    }
    return s.value
  }
}

type IStateSetterFunc = ReturnType<typeof createStateSetterFunc>

interface IModelOption {
  immediate: boolean
  unique: boolean
  autoRollback: boolean
}

class Model<T = any> extends State<T> {
  constructor (
    public getQueryWhere: () => IModelQuery,
    public options: IModelOption)
  {
    super(null)
    if (options.immediate) {
      this.query()
    }
  }
  async query () {
    const q = this.getQueryWhere()
    const result = await getModelFind()(q.entity, q.where)
    if (this.options.unique) {
      this.updateFromRemote(result[0])
    } else {
      this.updateFromRemote(result)
    }
  }
  updateFromRemote (v: T) {
    this._internalValue = v
    this.notify()
  }
  async updateWithPatches(v: T, patches: IPatch[]) {
    const oldValue = this._internalValue
    this.update(v)
    try {
      const diff = calculateDiff(this._internalValue, patches)
      await getExecuteDiff()(diff)
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
    const diff = calculateDiff(v, patches)
    await getPostDiffToServer()(diff)
    await this.query()
  }  
}

export function state<T = any>(initialValue: T): IStateSetterFunc {
  if (!currentRunnerScope) {
    throw new Error('must under a tarot runner')
  }

  const internalState = new State(initialValue)

  currentRunnerScope.addHook(internalState)

  return createStateSetterFunc(internalState, currentRunnerScope)
}


function createModelSetterFunc<T>(m: Model<T>, scope: CurrentRunnerScope) {
  return (paramter?: IModifyFunction<T>) => {
    if (isFunc(paramter)) {
      const [result, patches] = produceWithPatches(
        m.value,
        paramter,
      )

      if (currentInputeCompute) {
        scope.addComputePatches(m, patches)
      } else {
        m.updateWithPatches(result, patches)
      }
    }
    return m.value
  }
}

type createModelSetterFunc = ReturnType<typeof createStateSetterFunc>

export function model<T = any> (q: () => IModelQuery, op: IModelOption): createModelSetterFunc {
  if (!currentRunnerScope) {
    throw new Error('must under a tarot runner')
  }

  const internalModel = getEnv().client ? new ClientModel(q, op) : new Model(q, op)

  return createModelSetterFunc(internalModel, currentRunnerScope)
}

function isInputCompute (v: any) {
  return v.__inputComputeTag
}

interface IInputComputeOption {
  safety: boolean
}

interface InputComputeFn<T = any> extends Function {
  (arg: T): void | Promise<void>
  freezed?: boolean
}

function createInputComputeExecution<T> (
  func: InputComputeFn<T>,
  scope: CurrentRunnerScope
) {
  return async (arg:T ) => {
    currentInputeCompute = func
    scope.beforeInputCompute(func)
    if (!checkFreeze(func)) {
      await func(arg)
    }
    currentInputeCompute = null
    scope.afterInputCompute(func)
    unFreeze(func)
  }
}



function createServerInputComputeExecution<T> (
  func: InputComputeFn<T>,
  scope: CurrentRunnerScope
) {
  return async (arg:T ) => {
    currentInputeCompute = func
    scope.beforeInputCompute(func)
    if (!checkFreeze(func)) {
      const context = scope.createInputComputeContext(func, arg)
      const result = await getModelConfig().postComputeToServer(context)
      scope.applyContext(result)
    }
    currentInputeCompute = null
    scope.afterInputCompute(func)
    unFreeze(func)
  }
}

export function inputCompute<T> (func: InputComputeFn<T>, option: IInputComputeOption) {
  if (!currentRunnerScope) {
    throw new Error('must under a tarot runner')
  }  
  const wrapCompute = createInputComputeExecution(func, currentRunnerScope)
  currentRunnerScope.addHook(wrapCompute)

  return wrapCompute
}

export function inputComputeServer<T> (func: InputComputeFn<T>, option: IInputComputeOption) {
  if (!currentRunnerScope) {
    throw new Error('must under a tarot runner')
  }

  const wrapCompute = createServerInputComputeExecution(func, currentRunnerScope)
  currentRunnerScope.addHook(wrapCompute)

  return wrapCompute
}

export function after (targets: IScopeHook[], callback: (...args: IScopeHook[]) => void) {
  if (!currentRunnerScope) {
    throw new Error('must under a tarot runner')
  }

  const fn = () => {
    callback(...targets)
  }
  targets.forEach(hook => {
    currentRunnerScope.addWatch(hook, fn, 'before')
  })
}

export function before (targets: IScopeHook[], callback: (...args: IScopeHook[]) => void) {
  if (!currentRunnerScope) {
    throw new Error('must under a tarot runner')
  }

  const fn = () => {
    callback(...targets)
  }
  targets.forEach(hook => {
    currentRunnerScope.addWatch(hook, fn, 'after')
  })
}