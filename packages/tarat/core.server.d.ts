import EventEmitter from 'eventemitter3';
import { Draft } from 'immer';

declare type IModelCreateData = Omit<IModelData, 'where'> | Omit<IModelData, 'where'>[];
interface IModelData {
    where: {
        id: number;
    };
    data: {
        [k: string]: any | {
            connect?: {
                id: number;
            };
            create?: IModelData;
        };
    };
    include?: Record<string, boolean>;
}
interface IQuerySelect {
    [k: string]: boolean | {
        select: IQuerySelect;
    };
}
interface IQueryInclude {
    [k: string]: boolean | {
        include: IQueryInclude;
    };
}
interface IQueryWhere {
    where?: {
        [k: string]: any;
    };
    skip?: number;
    take?: number;
    include?: IQueryInclude;
    select?: IQuerySelect;
    orderBy?: {
        [k: string]: 'desc' | 'asc';
    };
    cursor?: {
        id?: number;
    };
}
interface IModelQuery {
    entity: string;
    query: IQueryWhere;
}
declare type TCacheFrom = 'cookie' | 'regularKV';
interface IRunningContext {
    cookies: {
        set: (name: string, value?: string | null, opts?: any) => void;
        get: (name: string, opts?: any) => string | undefined;
    };
}
declare const plugins: {
    Model?: {
        find(from: string, entity: string, query: IModelQuery['query']): Promise<any>;
        update(from: string, entity: string, query: IModelData): Promise<number[]>;
        create(from: string, entity: string, data: IModelCreateData): Promise<any>;
        remove(from: string, entity: string, data: Omit<IModelData, 'data'>): Promise<number[]>;
        executeDiff(from: string, entity: string, d: IDiff): Promise<void>;
    };
    Cache?: {
        getValue<T>(scope: CurrentRunnerScope, k: string, from: TCacheFrom): Promise<T | undefined>;
        setValue<T>(scope: CurrentRunnerScope, k: string, value: T, from: TCacheFrom): Promise<void>;
        clearValue(scope: CurrentRunnerScope, k: string, from: TCacheFrom): void;
    };
    Context?: {
        postDiffToServer(entity: string, d: IDiff): Promise<void>;
        postComputeToServer(c: IHookContext): Promise<IHookContext>;
        postQueryToServer(c: IHookContext): Promise<IHookContext>;
    };
    GlobalRunning?: {
        setCurrent(scope: CurrentRunnerScope, runningApi: IRunningContext | null): void;
        getCurrent(scope: CurrentRunnerScope): IRunningContext | null;
    };
    cookie?: {
        get<T>(scope: CurrentRunnerScope, k: string): Promise<T | undefined>;
        set<T>(scope: CurrentRunnerScope, k: string, value: T): Promise<void>;
        clear(scope: CurrentRunnerScope, k: string): void;
    };
    regularKV?: {
        get<T>(scope: CurrentRunnerScope, k: string): Promise<T | undefined>;
        set<T>(scope: CurrentRunnerScope, k: string, value: T): Promise<void>;
        clear(scope: CurrentRunnerScope, k: string): void;
    };
};
declare type IPlugins = typeof plugins;
declare type TPluginKey = keyof IPlugins;
declare function getPlugin<T extends TPluginKey>(k: T): Exclude<{
    Model?: {
        find(from: string, entity: string, query: IQueryWhere): Promise<any>;
        update(from: string, entity: string, query: IModelData): Promise<number[]>;
        create(from: string, entity: string, data: IModelCreateData): Promise<any>;
        remove(from: string, entity: string, data: Omit<IModelData, "data">): Promise<number[]>;
        executeDiff(from: string, entity: string, d: {
            create: IStackUnit[];
            update: IStackUnit[];
            remove: IStackUnit[];
        }): Promise<void>;
    };
    Cache?: {
        getValue<T_1>(scope: CurrentRunnerScope<any>, k: string, from: TCacheFrom): Promise<T_1>;
        setValue<T_2>(scope: CurrentRunnerScope<any>, k: string, value: T_2, from: TCacheFrom): Promise<void>;
        clearValue(scope: CurrentRunnerScope<any>, k: string, from: TCacheFrom): void;
    };
    Context?: {
        postDiffToServer(entity: string, d: {
            create: IStackUnit[];
            update: IStackUnit[];
            remove: IStackUnit[];
        }): Promise<void>;
        postComputeToServer(c: IHookContext): Promise<IHookContext>;
        postQueryToServer(c: IHookContext): Promise<IHookContext>;
    };
    GlobalRunning?: {
        setCurrent(scope: CurrentRunnerScope<any>, runningApi: IRunningContext): void;
        getCurrent(scope: CurrentRunnerScope<any>): IRunningContext;
    };
    cookie?: {
        get<T_3>(scope: CurrentRunnerScope<any>, k: string): Promise<T_3>;
        set<T_4>(scope: CurrentRunnerScope<any>, k: string, value: T_4): Promise<void>;
        clear(scope: CurrentRunnerScope<any>, k: string): void;
    };
    regularKV?: {
        get<T_5>(scope: CurrentRunnerScope<any>, k: string): Promise<T_5>;
        set<T_6>(scope: CurrentRunnerScope<any>, k: string, value: T_6): Promise<void>;
        clear(scope: CurrentRunnerScope<any>, k: string): void;
    };
}[T], undefined>;
declare function loadPlugin<T extends TPluginKey>(k: T, p: IPlugins[T]): void;

declare const isArray: (arg: any) => arg is any[];
declare type AnyObject = {
    [key: string]: any;
};
declare const ownKeys: (target: AnyObject) => PropertyKey[];
declare const getOwnPropertyDescriptors: <T>(o: T) => { [P in keyof T]: TypedPropertyDescriptor<T[P]>; } & {
    [x: string]: PropertyDescriptor;
};
declare function shallowCopy(base: any): any;
declare const isEqual: (x: any, y: any) => boolean;
declare function last<T>(arr: T[]): T;
declare function cloneDeep(obj?: any): any;
declare function applyPatchesToObject(target: any, patches: IDataPatch[]): void;
declare function isPrimtive(v: any): boolean;
declare function deleteKey(obj: any, p: IDataPatch): void;
declare function set(obj: any, path: string | (number | string)[], value: any): void;
declare function get(obj: any, path: string | (number | string)[]): any;
declare function map(target: object | any[], callback: (v: any, i: number, self: any[]) => any): any[];
declare function likeObject(target: any): boolean;
declare function isDef(v?: any): boolean;
declare function isUndef(v?: any): boolean;
declare function isFunc(f?: Function | any): boolean;
declare function isAsyncFunc(f?: any): boolean;
declare function isPromise(p?: any): boolean;
declare function isGenerator(g: any): boolean;
declare function nextTick(fn: () => void): () => void;
declare type TContextData = 'data' | 'unserialized' | 'state' | 'patch' | 'inputCompute' | 'model' | 'cache' | 'computed' | 'prismaModel' | 'writePrisma' | 'clientPrisma' | 'clientPrismaModel';
interface IModelPatchRecord {
    timing: number;
    patch: IModelPatch[];
}
interface IHookContext {
    initialArgList: any;
    data: Array<[TContextData, Promise<any>, number] | [TContextData, null] | [TContextData] | [TContextData, any, number]>;
    name: string;
    index?: number;
    indexName?: string;
    args?: any[];
    patch?: [string, IModelPatchRecord[]][];
}
declare type THookDeps = Array<[
    'h' | 'ic',
    number,
    (number | ['c', number, string])[],
    (number | ['c', number, string])[]?
]>;
declare function findWithDefault<T>(arr: T[], fn: (a: T) => boolean, defaults?: T): T | void;
declare type IPatch = IDataPatch | IModelPatch;
declare const isDataPatch: (p: IPatch) => boolean;
declare const isModelPatch: (p: IPatch) => boolean;
interface IDataPatch {
    op: 'replace' | 'add' | 'remove';
    path: (string | number)[];
    value?: any;
}
declare type IModelPatchCreate = {
    op: 'create';
    value: IModelCreateData;
};
declare type IModelPatchUpdate = {
    op: 'update';
    value: IModelData;
};
declare type IModelPatchRemove = {
    op: 'remove';
    value: Omit<IModelData, 'data'>;
};
declare type IModelPatch = IModelPatchCreate | IModelPatchUpdate | IModelPatchRemove;
interface IStackUnit {
    value: {
        [k: string]: any;
    };
    source: {
        [k: string]: any;
    };
    currentFieldPath: string;
}
declare type IDiff = ReturnType<typeof calculateDiff>;
/**
 * 根据patch计算diff，决定要进行的数据库操作
 */
declare function calculateDiff(data: any | any[], ps: IDataPatch[]): {
    create: IStackUnit[];
    update: IStackUnit[];
    remove: IStackUnit[];
};
declare type TPath = (string | number)[];
/**
 * 修改了对象或数组的patch，计算
 * 如果修改了数组的子元素，就上升到整个数组，因为数组的变化通过patch来反推太不准确了
 * patch本身已经是按计算并合并过的，这里不需要考虑合并问题
 * a.0.b.0.c --> a 变化
 * a.b.c --> a.b.c 变化，需要通知到a.b吗？因为如果不是进一步的依赖，那说明b就是primitive的
 */
declare function calculateChangedPath(source: any, ps: IDataPatch[]): TPath[];
declare function setEnv(env: 'server' | 'client'): void;
declare function getEnv(): {
    client: boolean;
    server: boolean;
};
declare let enableLog: boolean;
declare function log(pre: string, ...rest: any[]): void;
declare function debuggerLog(open: boolean): void;
declare function checkQueryWhere(where: IQueryWhere['where']): boolean;
declare function getDeps(f: Driver): THookDeps;
declare function getName(f: Driver): string;
declare function getNames(f: Driver): THookNames;
declare type THookNames = [number, string][];
interface Driver extends Function {
    (...prop: any): any;
    __deps__?: THookDeps;
    __names__?: THookNames;
    __name__?: string;
}
declare type BM = Driver;
declare function runGenerator(gen: Generator, onResume: () => void, onSuspend: () => void): Promise<unknown>;
declare function makeBatchCallback<T extends (...prop: any[]) => any>(fn: T): (...args: Parameters<T>) => void;
declare function shortValue(v: undefined | Symbol | any): "@undef" | "@init";
declare class DataGraphNode {
    id: number;
    type: THookDeps[0][0];
    toGet: Set<DataGraphNode>;
    toSet: Set<DataGraphNode>;
    toCall: Set<DataGraphNode>;
    constructor(id: number, type: THookDeps[0][0]);
    addToGet(n: DataGraphNode): void;
    addToSet(n: DataGraphNode): void;
    addToCall(n: DataGraphNode): void;
    get children(): Set<DataGraphNode>;
    getAllChildren(all?: Set<DataGraphNode>): Set<DataGraphNode>;
}
declare function dataGrachTraverse(source: DataGraphNode | DataGraphNode[], callback: (n: DataGraphNode, ancestors: DataGraphNode[]) => boolean | void): void;
declare function getDependencies(rootNodes: Set<DataGraphNode>, id: number): Set<DataGraphNode>;
declare function mapGraph(s: Set<DataGraphNode>): Map<number, DataGraphNode>;
declare function mapGraphSetToIds(s: Set<DataGraphNode>): Set<number>;
declare function getNextNodes(current: DataGraphNode): Set<DataGraphNode>;
declare function getPrevNodes(rootNodes: Set<DataGraphNode>, current: {
    id: number;
}): Set<DataGraphNode>;
declare function getDependentPrevNodes(rootNodes: Set<DataGraphNode>, current: {
    id: number;
}): Set<DataGraphNode>;
declare function getDependentPrevNodesWithBlock(rootNodes: Set<DataGraphNode>, current: {
    id: number;
}, blocks?: Set<DataGraphNode>): Set<DataGraphNode>;
declare function getShallowDependentPrevNodes(rootNodes: Set<DataGraphNode>, current: {
    id: number;
}): Set<DataGraphNode>;
declare function getInfluencedNextNodes(rootNodes: Set<DataGraphNode>, current: {
    id: number;
}): Set<DataGraphNode>;
declare function getShallowInfluencedNextNodes(rootNodes: Set<DataGraphNode>, current: {
    id: number;
}): Set<DataGraphNode>;
declare function constructDataGraph(contextDeps: THookDeps): Set<DataGraphNode>;
declare function getRelatedIndexes(index: number[] | number, contextDeps: THookDeps): Set<number>;
declare function getShallowRelatedIndexes(index: number[] | number, contextDeps: THookDeps): Set<number>;

declare function freeze(target: {
    _hook?: {
        freezed?: boolean;
    };
}): void;
interface ITarget<T> {
    watcher: Watcher<T>;
    notify: (hook?: T, patches?: IPatch[], rc?: ReactiveChain) => void;
}
interface ISource<U> {
    watchers: Set<Watcher<U>>;
    addWatcher: (w: Watcher<U>) => void;
}
declare class Watcher<T = Hook> {
    target: ITarget<ISource<T>>;
    deps: Map<ISource<T>, (string | number)[][]>;
    constructor(target: ITarget<ISource<T>>);
    notify(dep: ISource<T>, path: TPath, patches?: IPatch[], reactiveChain?: ReactiveChain): boolean;
    addDep(dep: ISource<T>, path?: (number | string)[]): () => void;
}
declare class Hook extends EventEmitter {
    /** hook's name for debugging */
    name?: string;
    freezed?: boolean;
    watchers: Set<Watcher<this>>;
    addWatcher(w: Watcher<Hook>): void;
}
declare function isState(h: {
    _hook?: State;
}): boolean;
declare class State<T = any> extends Hook {
    scope?: CurrentRunnerScope;
    _internalValue: T;
    freezed?: boolean;
    modifiedTimstamp: number;
    inputComputePatchesMap: Map<InputCompute, [T, IPatch[]]>;
    constructor(data: T, scope?: CurrentRunnerScope);
    trigger(path?: (number | string)[], patches?: IPatch[], reactiveChain?: ReactiveChain<T>, triggeredSet?: Set<Watcher>): Set<Watcher<Hook>>;
    get value(): T;
    update(v: T, patches?: IDataPatch[], silent?: boolean, reactiveChain?: ReactiveChain<T>): void;
    applyComputePatches(ic: InputCompute, reactiveChain?: ReactiveChain<T>): void;
    getInputComputeDraftValue(): T;
    addComputePatches(value: T, patches: IPatch[]): void;
}
declare type PartialGetter<T> = {
    [K in keyof T]?: T[K];
};
declare type TGetterData<T> = () => PartialGetter<T>;
interface AsyncHook<T> {
    init: boolean;
    getterPromise: Promise<T> | null;
    startAsyncGetter: () => {
        end: () => void;
        valid: () => boolean;
    };
    pending: boolean;
}
declare class AsyncState<T> extends State<T> implements AsyncHook<T> {
    init: boolean;
    getterPromise: Promise<T> | null;
    asyncCount: number;
    startAsyncGetter(): {
        end: () => void;
        valid: () => boolean;
    };
    get pending(): boolean;
}
declare const writeInitialSymbol: unique symbol;
declare abstract class Model<T extends any[]> extends AsyncState<T[]> {
    entity: string;
    options: IModelOption;
    scope: CurrentRunnerScope;
    queryWhereComputed: Computed<IModelQuery['query'] | void> | null;
    watcher: Watcher;
    constructor(entity: string, getter: (() => IModelQuery['query'] | undefined) | undefined, options: IModelOption, scope: CurrentRunnerScope);
    setGetter(fn: () => IModelQuery['query'] | undefined): void;
    notify(h?: Hook, p?: IPatch[], reactiveChain?: ReactiveChain): void;
    getQueryWhere(reactiveChain?: ReactiveChain): Promise<IModelQuery['query'] | void>;
    get value(): T[];
    ready(): Promise<void>;
    query(reactiveChain?: ReactiveChain): void;
    enableQuery(): Promise<boolean>;
    abstract executeQuery(reactiveChain?: ReactiveChain): Promise<void>;
    abstract exist(obj: Partial<T[0]>): Promise<T | undefined>;
    abstract refresh(): Promise<void>;
    abstract checkAndRefresh(): Promise<void>;
    applyComputePatches(ic: InputCompute, reactiveChain?: ReactiveChain): Promise<void>;
    abstract updateWithPatches(v: T[], patches: IPatch[], silent: boolean, reactiveChain?: ReactiveChain): Promise<void>;
}
declare abstract class WriteModel<T extends Object> extends AsyncState<T | Symbol> {
    sourceModelGetter: {
        _hook: Model<T[]>;
    } | string;
    getData: (() => T) | undefined;
    abstract identifier: string;
    entity: string;
    sourceModel?: Model<T[]>;
    constructor(sourceModelGetter: {
        _hook: Model<T[]>;
    } | string, getData: (() => T) | undefined, scope: CurrentRunnerScope);
    setGetter(fn: () => T): void;
    abstract createRow(obj?: Partial<T>): Promise<void>;
    abstract updateRow(where: number, obj?: {
        [k: string]: any;
    }): Promise<void>;
    abstract removeRow(where: number): Promise<void>;
    abstract executeModelPath(ps: IModelPatch[]): Promise<void>;
    applyComputePatches(ic: InputCompute, reactiveChain?: ReactiveChain): Promise<void>;
}
/** TIP: code for example */
declare abstract class ClientModel<T extends any[]> extends Model<T> {
}
/** TIP: code for example */
declare abstract class ClientWriteModel<T> extends WriteModel<T> {
}
/**
 * only used in writing data to model entity
 */
declare const writePrismaInitialSymbol: unique symbol;
declare class Prisma<T extends any[]> extends Model<T> {
    identifier: string;
    executeQuery(reactiveChain?: ReactiveChain): Promise<void>;
    exist(obj: Partial<T[0]>): Promise<T>;
    refresh(): Promise<void>;
    updateWithPatches(v: T[], patches: IDataPatch[], silent: boolean, reactiveChain?: ReactiveChain): Promise<void>;
    checkAndRefresh(): Promise<void>;
}
declare class WritePrisma<T> extends WriteModel<T> {
    identifier: string;
    executeModelPath(ps: IModelPatch[]): Promise<void>;
    createRow(obj?: Partial<T>, include?: {
        [k in keyof T]: boolean;
    }): Promise<void>;
    updateRow(where: number, obj?: {
        [k: string]: any;
    }): Promise<void>;
    removeRow(where?: number): Promise<void>;
}
declare class ClientPrisma<T extends any[]> extends Prisma<T> {
    executeQuery(): Promise<void>;
    updateWithPatches(): Promise<void>;
    checkAndRefresh(): Promise<void>;
}
/**
 * writePrisma in client will record the changing
 */
declare class ClientWritePrisma<T> extends WritePrisma<T> {
    createRow(obj?: Partial<T>): Promise<void>;
    updateRow(whereId: number, obj?: {
        [k: string]: any;
    }): Promise<void>;
    removeRow(whereId: number): Promise<void>;
}
interface ICacheOptions<T> {
    source?: {
        _hook: State<T>;
    };
    defaultValue?: T;
    from: TCacheFrom;
}
declare const CacheInitialSymbol: unique symbol;
declare class Cache<T> extends AsyncState<T | Symbol> {
    options: ICacheOptions<T>;
    scope: CurrentRunnerScope;
    getterKey: string;
    watcher: Watcher;
    source: State<T> | undefined;
    getterPromise: Promise<any> | null;
    constructor(key: string, options: ICacheOptions<T>, scope: CurrentRunnerScope);
    notify(hook?: Hook, p?: IPatch[], reactiveChain?: ReactiveChain): void;
    get value(): T | Symbol;
    executeQuery(reactiveChain?: ReactiveChain): Promise<void>;
    /**
     * call by outer
     * @param v new value
     * @param patches new value with patches
     * @param silent update value wont notify watcher
     * @param reactiveChain
     */
    update(v?: T | Symbol, patches?: IPatch[], silent?: boolean, reactiveChain?: ReactiveChain): Promise<void>;
}
declare function setCurrentComputed(c: Computed<any>[]): void;
declare const ComputedInitialSymbol: unique symbol;
declare class Computed<T> extends AsyncState<T | Symbol> {
    getter: FComputedFunc<T | Symbol> | FComputedFuncAsync<T | Symbol> | FComputedFuncGenerator<T | Symbol>;
    batchRunCancel: () => void;
    watcher: Watcher<State<any>>;
    constructor(getter: FComputedFunc<T | Symbol> | FComputedFuncAsync<T | Symbol> | FComputedFuncGenerator<T | Symbol>, scope?: CurrentRunnerScope);
    get value(): T | Symbol;
    run(innerReactiveChain?: ReactiveChain): void;
    tryModify(reactiveChain?: ReactiveChain): void;
    notify(h?: Hook, p?: IPatch[], reactiveChain?: ReactiveChain): void;
}
declare class ClientComputed<T> extends Computed<T> {
    run(): void;
}
declare class InputCompute<P extends any[] = any> extends Hook {
    getter: InputComputeFn<P> | AsyncInputComputeFn<P> | GeneratorInputComputeFn<P>;
    /** @TODO should not couple the "scope" */
    scope: CurrentRunnerScope;
    constructor(getter: InputComputeFn<P> | AsyncInputComputeFn<P> | GeneratorInputComputeFn<P>, 
    /** @TODO should not couple the "scope" */
    scope: CurrentRunnerScope);
    inputFuncStart(): void;
    commitComputePatches(reactiveChain?: ReactiveChain): (void | Promise<void>)[] | undefined;
    inputFuncEnd(reactiveChain?: ReactiveChain): Promise<void>;
    run(...args: any): Promise<void>;
}
declare class AsyncInputCompute<T extends any[]> extends InputCompute<T> implements AsyncHook<T> {
    init: boolean;
    getterPromise: Promise<T> | null;
    asyncCount: number;
    startAsyncGetter(): {
        end: () => void;
        valid: () => boolean;
    };
    get pending(): boolean;
}
declare class InputComputeInServer<P extends any[]> extends AsyncInputCompute<P> {
    run(...args: any[]): Promise<void>;
}
declare function startdReactiveChain(name?: string): ReactiveChain<any>;
declare function stopReactiveChain(): void;
/**
 * collect reactive chain for debug
 */
declare type ChainTrigger<T> = CurrentRunnerScope<any> | State<T> | InputCompute<any>;
declare class ReactiveChain<T = any> {
    parent?: ReactiveChain;
    hook?: ChainTrigger<T>;
    isRoot: boolean;
    allLeafCount: number;
    order: number;
    name?: string;
    hookIndex?: number;
    hookKey?: string;
    oldValue: T | undefined;
    newValue: T | undefined;
    hasNewValue: boolean;
    children: ReactiveChain<T>[];
    type?: 'update' | 'notify' | 'call';
    constructor(parent?: ReactiveChain, hook?: ChainTrigger<T>);
    static withChain<T extends (...args: any[]) => any>(chain: ReactiveChain, fn: T): ReturnType<T>;
    plusLeaf(): any;
    stop(): void;
    update(): void;
    add(trigger: ChainTrigger<T>, key?: string): ReactiveChain<T>;
    addCall(trigger: ChainTrigger<T>, key?: string): ReactiveChain<T>;
    addNotify(trigger: ChainTrigger<T>): ReactiveChain<T>;
    addUpdate(child: ChainTrigger<T>): ReactiveChain<T>;
    print(): void;
}
declare enum EScopeState {
    init = "init",
    idle = "idle",
    pending = "pending"
}
/**
 * ScopeContext designed for serialization
 */
declare class RunnerContext<T extends Driver> {
    driverName: string;
    args?: Parameters<T>;
    initialArgList: Parameters<T>;
    initialData: IHookContext['data'] | null;
    triggerHookIndex?: number;
    triggerHookName?: string;
    patch?: IHookContext['patch'];
    withInitialContext: boolean;
    constructor(driverName: string, args?: Parameters<T>, initialContext?: IHookContext);
    serialize(type: 'current' | 'next'): void;
    formatContextData(hooks: Hook[], enable?: (i: number) => boolean): ([TContextData, Promise<any>, number] | [TContextData, null] | [TContextData] | [TContextData, any, number])[];
    /**
     * need deliver context principles, sort by priority:
     * 1.model/cache(server) needn't
     * 2.state
     * 3.related set/get
     */
    serializeAction(hooks: Hook[], hookIndex: number, args: any[], deps: Set<number>): IHookContext;
    serializePatch(hooks: Hook[], modelPatchEvents: ModelEvent): IHookContext;
    serializeBase(hooks: Hook[]): IHookContext;
    apply(hooks: Hook[], c: IHookContext, needUpdateCallback: (h: State, value: any, timestamp: number) => void): void;
}
declare class ModelEvent {
    private data;
    listeners: Function[];
    subscribe(f: () => void): () => void;
    from(arr: IHookContext['patch']): void;
    toArray(): [string, IModelPatchRecord[]][];
    getRecord(m: {
        entity: string;
    }): IModelPatchRecord[];
    pushPatch(m: {
        entity: string;
    }, p: IModelPatch[]): void;
}
declare class CurrentRunnerScope<T extends Driver = any> {
    runnerContext: RunnerContext<T>;
    intialContextDeps: THookDeps;
    intialContextNames: THookNames;
    modelPatchEvents: ModelEvent;
    name?: string;
    hooks: (Hook | undefined)[];
    composes: Record<string, any>[];
    outerListeners: Function[];
    stateChangeCallbackRunning: boolean;
    stateChangeCallbackCancel: () => void;
    stateChangeWaitHooks: Set<Hook>;
    watcher: Watcher<Hook>;
    initialHooksSet?: Set<number>;
    reactiveChainStack: ReactiveChain[];
    /**
     * receive by runner options
     */
    beleiveContext: boolean;
    updateCallbackSync: boolean;
    applyComputeParalle: boolean;
    effectFuncArr: Function[];
    disposeFuncArr: Function[];
    constructor(runnerContext: RunnerContext<T>, intialContextDeps: THookDeps, intialContextNames: THookNames, modelPatchEvents: ModelEvent);
    /**
     * copy context value into scope for updateXXX hook
     */
    initializeHookSet(): void;
    setOptions(op: Partial<IRunnerOptions>): void;
    effect(f: Function): void;
    flushEffects(): void;
    /**
     * call the executable hook: Model, InputCompute
     * @TODO the executable hook maybe need a abstract base class
     */
    callHook(hookIndex: number, args: any[]): Promise<void>;
    /**
     * while enter UI will activate this function
     */
    activate(fn?: Function): void;
    deactivate(fn?: Function): void;
    private notifyAllModel;
    onUpdate(f: Function): () => void;
    notifyOuter(): void;
    notify(s?: Hook): void;
    addHook(v: Hook | undefined): void;
    applyDepsMap(): void;
    /**
     * offset compose names and current initial names
     */
    appendComposeNames(si: number, names?: THookNames): void;
    /**
     * add compose deps to current driver.
     * plus current hook dep index
     */
    appendComposeDeps(si: number, ei: number, deps?: THookDeps): void;
    applyAllComputePatches(currentInputCompute: InputCompute, reactiveChain?: ReactiveChain): (void | Promise<void>)[] | undefined;
    hookNumberIndexDeps(): THookDeps;
    /**
     * get all related hook index according to passived hookIndex
     * design logic:
     * 1.getD -> getD -> getD
     * 2.setD in who's getD -> getD
     */
    getRelatedHookIndexes(hookIndex: number): Set<number>;
    getShallowRelatedHookIndexes(hookIndex: number): Set<number>;
    getDependenceByModel(indexes: Set<number>): Set<number>;
    createBaseContext(): IHookContext;
    getRelatedIndexesByHook(h: Hook, excludeSelf?: boolean): Set<number>;
    /**
     * as a resonse while receive a input context
     */
    createPatchContext(): IHookContext;
    /**
     * as a input of other's Runner and trigger
     * need deliver context principles, sort by priority:
     * 1.model/cache(server) needn't
     * 2.state
     * 3.related set/get
     */
    createActionContext(h?: Hook, args?: any[]): IHookContext;
    createShallowActionContext(h?: Hook, args?: any[]): IHookContext;
    createInputComputeContext(h?: Hook, args?: any[]): IHookContext;
    applyContextFromServer(c: IHookContext): void;
    getState(): EScopeState.idle | EScopeState.pending;
    readyReleated(h: Hook): Promise<void>;
    ready(specifies?: Set<number>): Promise<void>;
}
declare let GlobalModelEvent: ModelEvent | null;
declare function setGlobalModelEvent(me: ModelEvent | null): void;
interface IRunnerOptions {
    beleiveContext: boolean;
    updateCallbackSync?: boolean;
    applyComputeParalle?: boolean;
    runnerContext?: Symbol;
}
declare class Runner<T extends Driver> {
    driver: T;
    scope: CurrentRunnerScope<T>;
    options: IRunnerOptions;
    constructor(driver: T, options?: IRunnerOptions);
    prepareScope(args?: Parameters<T>, initialContext?: IHookContext): CurrentRunnerScope<T>;
    executeDriver(scope: CurrentRunnerScope<T>): ReturnType<T>;
    /**
     * @TODO need to refact because of this function should both return result and scope
     */
    init(args?: Parameters<T>, initialContext?: IHookContext): ReturnType<T>;
    mount(args?: Parameters<T>, initialContext?: IHookContext): ReturnType<T>;
    update(initialContext: IHookContext): ReturnType<T>;
    /**
     * @TODO after init method refactor. shouldnt callHook through runner but scope
     */
    callHook(hookIndex: number, args: any[]): Promise<void>;
    state(): EScopeState.idle | EScopeState.pending;
    ready(): Promise<void>;
}
declare function internalProxy<T>(source: State<T>, _internalValue: T, path?: (string | number)[]): T;
declare type IModifyFunction<T> = (draft: Draft<T>) => void;
interface IModelOption {
    immediate?: boolean;
    unique?: boolean;
    autoRollback?: boolean;
    pessimisticUpdate?: boolean;
    ignoreClientEnable?: boolean;
    checkRefresh?: (ps: IPatch[]) => boolean;
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
declare const mountHookFactory: {
    state: typeof mountState;
    model: typeof mountPrisma;
    prisma: typeof mountPrisma;
    writePrisma: typeof mountWritePrisma;
    writeModel: typeof writeModel;
    cache: typeof mountCache;
    computed: typeof mountComputed;
    computedInServer: typeof mountComputedInServer;
    inputCompute: typeof mountInputCompute;
    inputComputeInServer: typeof mountInputComputeInServer;
};
declare const updateHookFactory: {
    state: typeof updateState;
    model: typeof updatePrisma;
    writeModel: typeof writeModel;
    prisma: typeof updatePrisma;
    writePrisma: typeof mountWritePrisma;
    cache: typeof updateCache;
    computed: typeof updateComputed;
    computedInServer: typeof updateComputedInServer;
    inputCompute: typeof updateInputCompute;
    inputComputeInServer: typeof updateInputComputeInServer;
};
declare const hookFactoryFeatures: {
    /**
     * all hooks name list
     */
    all: string[];
    /**
     * need other hook as data source
     */
    withSource: string[];
    /**
     * manual calling by User or System
     */
    initiativeCompute: string[];
    /**
     * only compatibility with server
     */
    serverOnly: string[];
};
/** @TODO need refact code to auto export these hooks */
declare const hookFactoryNames: string[];
declare const hasSourceHookFactoryNames: string[];
declare const initiativeComputeHookFactoryNames: string[];
declare let currentHookFactory: {
    state: typeof mountState;
    model: typeof mountPrisma;
    prisma: typeof mountPrisma;
    writePrisma: typeof mountWritePrisma;
    cache: typeof mountCache;
    computed: typeof mountComputed;
    computedInServer: typeof mountComputedInServer;
    inputCompute: typeof mountInputCompute;
    inputComputeInServer: typeof mountInputComputeInServer;
};
declare function updateState<T>(initialValue?: T): (() => any) & {
    _hook: any;
};
declare function mountState<T>(initialValue?: T): {
    (): T;
    (paramter: IModifyFunction<T>): [T, IPatch[]];
} & {
    _hook: State<T>;
};
declare function updatePrisma<T extends any[]>(e: string, q?: () => IModelQuery['query'] | undefined, op?: IModelOption): any;
declare function mountPrisma<T extends any[]>(e: string, q?: () => IModelQuery['query'] | undefined, op?: IModelOption): {
    (): T;
    (paramter: IModifyFunction<T>): Promise<[T, IPatch[]]>;
} & {
    _hook: Prisma<T>;
    exist: (obj: Partial<T[0]>) => Promise<T>;
    refresh: () => Promise<void>;
};
declare function mountWritePrisma<T>(source: {
    _hook: Model<T[]>;
}, q: () => T): (() => never) & {
    _hook: WritePrisma<T>;
    create: (obj?: Partial<T>, include?: { [k in keyof T]: boolean; }) => Promise<void>;
    update: (where: number, obj?: {
        [k: string]: any;
    }) => Promise<void>;
    remove: (where?: number) => Promise<void>;
};
declare function updateCache<T>(key: string, options: ICacheOptions<T>): (() => any) & {
    _hook: any;
};
declare function mountCache<T>(key: string, options: ICacheOptions<T>): {
    (): T;
    (paramter: IModifyFunction<T>): [T, IPatch[]];
} & {
    _hook: Cache<T>;
};
declare function updateComputed<T>(fn: FComputedFuncGenerator<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function updateComputed<T>(fn: FComputedFuncAsync<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function updateComputed<T>(fn: FComputedFunc<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function mountComputed<T>(fn: FComputedFuncGenerator<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function mountComputed<T>(fn: FComputedFuncAsync<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function mountComputed<T>(fn: FComputedFunc<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function updateComputedInServer<T>(fn: FComputedFuncGenerator<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function updateComputedInServer<T>(fn: FComputedFuncAsync<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function updateComputedInServer<T>(fn: FComputedFunc<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function mountComputedInServer<T>(fn: FComputedFuncGenerator<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function mountComputedInServer<T>(fn: FComputedFuncAsync<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function mountComputedInServer<T>(fn: FComputedFunc<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function state<T>(initialValue: T): {
    (): T;
    (paramter: IModifyFunction<T>): [any, IPatch[]];
} & {
    _hook: State<T>;
};
declare function state<T = undefined>(): {
    (): T;
    (paramter: IModifyFunction<T | undefined>): [any, IPatch[]];
} & {
    _hook: State<T | undefined>;
};
declare function model<T extends any[]>(e: string, q?: () => IModelQuery['query'] | undefined, op?: IModelOption): {
    (): T;
    (paramter: IModifyFunction<T>): Promise<[T, IPatch[]]>;
} & {
    _hook: Prisma<T>;
    exist: (obj: Partial<T[0]>) => Promise<T>;
    refresh: () => Promise<void>;
};
declare function writeModel<T>(source: {
    _hook: Model<T[]>;
}, q: () => T): (() => never) & {
    _hook: WritePrisma<T>;
    create: (obj?: Partial<T>, include?: { [k in keyof T]: boolean; }) => Promise<void>;
    update: (where: number, obj?: {
        [k: string]: any;
    }) => Promise<void>;
    remove: (where?: number) => Promise<void>;
};
declare function prisma<T extends any[]>(e: string, q?: () => IModelQuery['query'] | undefined, op?: IModelOption): {
    (): T;
    (paramter: IModifyFunction<T>): Promise<[T, IPatch[]]>;
} & {
    _hook: Prisma<T>;
    exist: (obj: Partial<T[0]>) => Promise<T>;
    refresh: () => Promise<void>;
};
declare function writePrisma<T>(source: {
    _hook: Model<T[]>;
}, q?: () => T): (() => never) & {
    _hook: WritePrisma<T>;
    create: (obj?: Partial<T>, include?: { [k in keyof T]: boolean; }) => Promise<void>;
    update: (where: number, obj?: {
        [k: string]: any;
    }) => Promise<void>;
    remove: (where?: number) => Promise<void>;
};
declare function cache<T>(key: string, options: ICacheOptions<T>): {
    (): T;
    (paramter: IModifyFunction<T>): [T, IPatch[]];
} & {
    _hook: Cache<T>;
};
declare type FComputedFuncGenerator<T> = (prev?: T) => Generator<any, T, unknown>;
declare type FComputedFuncAsync<T> = (prev?: T) => T;
declare type FComputedFunc<T> = (prev?: T) => T;
declare function computed<T>(fn: FComputedFuncGenerator<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function computed<T>(fn: FComputedFuncAsync<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function computed<T>(fn: FComputedFunc<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function computedInServer<T>(fn: FComputedFuncGenerator<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function computedInServer<T>(fn: FComputedFuncAsync<T>): (() => T) & {
    _hook: Computed<T>;
};
declare function computedInServer<T>(fn: FComputedFunc<T>): (() => T) & {
    _hook: Computed<T>;
};
declare type InputComputeFn<T extends any[]> = (...arg: T) => void;
declare type AsyncInputComputeFn<T extends any[]> = (...arg: T) => Promise<void>;
declare type GeneratorInputComputeFn<T extends any[]> = (...arg: T) => Generator<unknown, void, T>;
declare function updateInputCompute(func: any): {
    (...args: any): Promise<void>;
    _hook: InputCompute<any>;
} | ((() => any) & {
    _hook: any;
});
declare function mountInputCompute(func: any): {
    (...args: any): Promise<void>;
    _hook: InputCompute<any>;
};
declare function inputCompute<T extends any[]>(func: AsyncInputComputeFn<T>): AsyncInputComputeFn<T> & {
    _hook: Hook;
};
declare function inputCompute<T extends any[]>(func: GeneratorInputComputeFn<T>): AsyncInputComputeFn<T> & {
    _hook: Hook;
};
declare function inputCompute<T extends any[]>(func: InputComputeFn<T>): InputComputeFn<T> & {
    _hook: Hook;
};
declare function updateInputComputeInServer(func: any): ((() => any) & {
    _hook: any;
}) | {
    (...args: any): Promise<void>;
    _hook: InputComputeInServer<any[]>;
};
declare function mountInputComputeInServer(func: any): {
    (...args: any): Promise<void>;
    _hook: InputComputeInServer<any[]>;
};
declare function inputComputeInServer<T extends any[]>(func: AsyncInputComputeFn<T>): AsyncInputComputeFn<T> & {
    _hook: Hook;
};
declare function inputComputeInServer<T extends any[]>(func: GeneratorInputComputeFn<T>): AsyncInputComputeFn<T> & {
    _hook: Hook;
};
declare function inputComputeInServer<T extends any[]>(func: InputComputeFn<T>): AsyncInputComputeFn<T> & {
    _hook: Hook;
};
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
declare function after(callback: () => void, targets: {
    _hook?: Hook;
}[]): void;
declare function before(callback: () => void, targets: {
    _hook?: Hook;
}[]): void;
declare function combineLatest<T>(arr: Array<Function & {
    _hook: State<T>;
}>): () => T;
/**
 * using another Driver inside of Driver
 * the important thing is that should consider how to compose their depsMap
 */
declare function compose<T extends Driver>(f: T, args?: any[]): ReturnType<T>;
/**
 * inject input data to Model as initial value
 */
declare type TModelGetter<T> = ReturnType<typeof model | typeof writePrisma>;
declare function connectModel<T>(modelGetter: TModelGetter<T>, dataGetter: TGetterData<T>): void;
declare function progress<T = any>(getter: {
    _hook: AsyncState<T> | AsyncInputCompute<T[]>;
}): () => {
    state: EScopeState;
};

export { AnyObject, BM, Cache, CacheInitialSymbol, ClientComputed, ClientModel, ClientPrisma, ClientWriteModel, ClientWritePrisma, Computed, ComputedInitialSymbol, CurrentRunnerScope, DataGraphNode, Driver, EScopeState, GlobalModelEvent, Hook, ICacheOptions, IDataPatch, IDiff, IHookContext, IModelCreateData, IModelData, IModelPatch, IModelPatchCreate, IModelPatchRecord, IModelPatchRemove, IModelPatchUpdate, IModelQuery, IPatch, IQueryWhere, IRunnerOptions, IRunningContext, IStackUnit, InputCompute, Model, ModelEvent, Prisma, ReactiveChain, Runner, RunnerContext, State, TCacheFrom, TContextData, THookDeps, THookNames, TPath, Watcher, WriteModel, WritePrisma, after, applyPatchesToObject, before, cache, calculateChangedPath, calculateDiff, checkQueryWhere, cloneDeep, combineLatest, compose, computed, computedInServer, connectModel, constructDataGraph, currentHookFactory, dataGrachTraverse, debuggerLog, deleteKey, enableLog, findWithDefault, freeze, get, getDependencies, getDependentPrevNodes, getDependentPrevNodesWithBlock, getDeps, getEnv, getInfluencedNextNodes, getName, getNames, getNextNodes, getOwnPropertyDescriptors, getPlugin, getPrevNodes, getRelatedIndexes, getShallowDependentPrevNodes, getShallowInfluencedNextNodes, getShallowRelatedIndexes, hasSourceHookFactoryNames, hookFactoryFeatures, hookFactoryNames, initiativeComputeHookFactoryNames, inputCompute, inputComputeInServer, internalProxy, isArray, isAsyncFunc, isDataPatch, isDef, isEqual, isFunc, isGenerator, isModelPatch, isPrimtive, isPromise, isState, isUndef, last, likeObject, loadPlugin, log, makeBatchCallback, map, mapGraph, mapGraphSetToIds, model, mountHookFactory, nextTick, ownKeys, prisma, progress, runGenerator, set, setCurrentComputed, setEnv, setGlobalModelEvent, shallowCopy, shortValue, startdReactiveChain, state, stopReactiveChain, updateHookFactory, writeInitialSymbol, writeModel, writePrisma, writePrismaInitialSymbol };
