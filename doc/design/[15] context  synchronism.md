# Context状态同步

考虑client/server之间同步 context data and depMaps

## dependent maps by compiler

在hook内是一个closure, 内部的state/model都是名称确定的

所以通过分析AST就直接建立depMaps，无需在hook运行之后才能确定

```javascript
function hook () {
  const myState = state()
  const ic = inputCompute(() => {
    myState(v => v + 1)
  })
  return { myState, ic }
}
```

通过扫AST，可以得知ic内是依赖了myState，而且这里不用担心引用问题

因为myState这个变量的作用域只在hook内，它的引用也是确定的，所以一定是hook内被使用，所以可以被AST扫描

结合hook的compose情况，由于hook的return的变量也一定是myState，在hook范围内

所以compose情况也可以扫AST得到

加入编译时之后，那在运行时就不用设置各种全局变量的flag了

但是没有flag的话会无法识别到myState里的具体字段的依赖，因为在getter里是会有动态逻辑，但这不影响大粒度的state依赖关系

```javascript
// must be PlainObject
const hookDepMaps = [
  [
    0, // can find target hook by the unique index
    [1], // get operation in 0 hook
    [], // set operation in 0 hook (currently, only InputCompute support this)
  ],
  [
    2,
    [3],
    [4]
  ]
]
```

deps静态分析的存储位置

- 生成额外的独立文件，好处是简单
  - 问题：在开发时比较奇怪，得先进行跑命令行监听才行


### BM 嵌套下

```javascript 
import {
  BM2,
} from './BM2'

import BM2Deps from './BM2.deps.json

// deps = [0, ]

function BM1 () {
  const s1 = state()

  const r2 = useOtherHook(BM2, [], BM2Deps) // 此时BM2的下标是从1开始

  const s2 = state()
}
```

在BM组合下，由于deps是依据当前BM的hook下标进行唯一确定的，所以在组合BM的情况下，需要进行下标的平移计算，确保下标能对应到原本的hook

计算的时机：
- 静态时
  - 问题：难以分析出hook内部引用的其它BM的 所在位置顺序和层次，来源，需要介入到构建系统才行
- 运行时
  - 问题：需要显示的感知到deps的存在，
    - 优化：也许可以通过构建编译自动替换掉

### 妥协场

在没有AST静态分析之前，所有的Context依然会全量同步

## context questions

there are some top questions：
- computed触发getter的时机，在client触发还是server触发
- send context时， 要携带的hook的值的范围怎么确定，依据是什么
- BM的初始化过程的流程该怎么抽象，初始化的数据源可以有哪些
- 确定hook的执行环境的默认原则，比如model在server端，如何通过尽可能少的配置化方式来修改它
- lazy model如何从server端同步数据
- 同步过程中如何避免触发hook中无关的model的重新get？

## principles

core principles sort by priority:
- send context的时候只传递有被依赖的hook上下文数据
  - 推论1：这些依赖hook在经历过server返回后，有些在server是被读或写，在回来后需要各自在update做完diff后才能确定是否trigger event
  - 推论2：没有被传递的hook不会被执行update，所以也就不更新
  - 推论3：after effect callback的运行时机只在于callback自身要求，且是异步的，默认是client，也可以手动afterInServer
  - 推论4：依赖关系必须是在hook声明的时候就静态存在，运行时只是补充具体到字段的细节
- 
- model的查询默认只能在server端执行
  - 推论1：computed内如果使用了异步的model，可以在client，如果此时Model正在加载中，则等待的server数据返回
  - 推论2：inputCompute内修改了model，必须提交到server端，并callHook，修改后等待model更新并一起返回context
  - 推论3：model不能接受context里的数据，在server端初始化hook的过程中必须无视immediate，立即查询。如果model不在这次的context范围内则必须immediate is false，避免无效查询
- 
- model可以是非immediate，在被get的时候才去触发首次查询
  - 推论1：同一个hook，此时server的model也是是非immediate，需要像callHook手动触发查询
- 
- model的查询结果是依赖于条件的，如果条件没变则不触发重新查询，但数据在client端可能是已经变了，需要提供自动刷新的机制
  - 推论1：model的自动刷新机制，就说明当前model必须暴露出 self referrence 或 related pointer 到全局
- 
- 考虑SSR的情况下，每个side hook都可以分为mount和update 2个阶段，它们的区分在于是否存在context
  - 推论1：即使是client hook，如果存有context，那么它在初始化的过程中也是使用update hook
  - 推论2：不同于react hook的memoizedState可以是plainObject，这里的hook还存在很多”行为“，所以即使是update过程也需要重新初始化，因为实例对象无法通过json序列化
  - 推论3：context是在初始化的最开始才进行读取，在读取hook函数时还不需要关心


## solution

Context的注入和同步，参考React hooks的链表数据结构的实现细节 [https://zhou-yg.github.io/#t14](https://zhou-yg.github.io/#t14)

还有源码细节参考[react的hooks实现](https://github.com/facebook/react/blob/79f54c16dc3d5298e6037df75db2beb3552896e9/packages/react-reconciler/src/ReactFiberHooks.new.js#L2827)

## differentiate mount/update

2个过程最大的差别在于是否 with context，hook初始化过程是

> 1.hook factory -> 2.get data from 入参/远端 或 Context -> 3.实例化Hook Class -> 4.实例化后的拓展行为

为了实现过程的简单性，应该把对于数据的读写都统一至读写层，这样方便在不同的runtime下，针对不同hook实现对数据的读写操作

“读”过程

client side路径

> Client side <- BM(state, model, ic) <- Scope <- Context(client) <- (rpc) <- Server side 

Server side 路径

> Server side <- BM(state, model, ic) <- Scope <- Context(server) <- Databse

中间的rpc方式有2种可选：
- 同步context的方式（默认）
- 传递{ entity, query } 直接query查询，这样就server不用重新初始化BM，提升性能，但是会牺牲了整体的响应性，只使用单一大数据的优化场景里

注意点，由于rpc传输的context是局部的，意味着有些hook如果没有get到值就只保留一个null占位符，该hook在执行过程中不会被使用到，如果使用了没有被初始化的hook，说明epMaps分析错了 或者 使用了不正当的hook使用方式


“写”过程

client side路径

> UI触发 -> BM.inputCompute -> Context(client).modify -> (rpc with dependent context ) -> Server side

server side handle request

> Serve side -> BM(state, model, ic) with context（同上面）-> call Bm.inputCompute -> Scope.applyPatches -> Context(server).applyPatches -> Database

server side response

> Database更新完成后 -> Context(server) -> Bm.inputCompute end -> 返回 Context(server).data -> Context(client).update -> Scope.trigger listener -> UI更新

## proxy context

在上述流程对于数据的读写都集中到了Context层，不同runtime对应不同的Context实现
- client 
- server

Context in Clinet
- state
  - get 内存读写
  - set 内存读写
- model
  - get 发起query请求，并携带依赖的其它hook
  - set 常规场景下在client端不会有这个操作
- cache
  - get 区分from
    - from server: redis之类，则发起query请求，cache应该只依赖key，不需要携带其他hook
    - from client：client端直接调用，读取
  - set 区分from
    - from server: 发起写操作
    - from client：直接调用

Context in Server
- state
  - get 内存读写
  - set 内存读写
- model
  - get 先获取条件，再执行数据查询
  - set 更新数据库
- cache
  - get 区分from
    - from server: redis之类，读写redis，需要等待它完成
    - from client：从传输的context里取，没有则返回null
  - set 区分from
    - from server: 发起写操作
    - from client：不能有在server操作client，可以把值写入内存，返回到client端的时候，由client端自己写入

剩下的其它二次hook：如computed，combineLatest，它们本质是一个可计算的state，所以数据读写的方式可以同state

## inputCompute的context副本

inputCompute中，对state或model的修改，本质是对context的修改

那么在inputComputed的执行生命周期内，读取到的Context应该是最新的，是base + patches的叠加

在执行周期结束之前，外面读取到的context还是旧，

在执行完成之后，总体commit patches，外面读到了最新的context


## blank value in context

hook's internalValue
- undefined
  - 代表了当前hook是空的状态
    - state初始化的时候没有默认值
- []
  - 2层含义：
    - model是初始化
      - model.init is true，说明model查询结果还没返回
    - model的查询结果是空
      - model.init is false
- null
  - 有值，但值是空

context data's value: ['hookType', hookValue?]，这里应该从长度判断
- 长度为1：
  - 无值，代表当前这个synchronism context下，不需要这个hook
- 长度为2：其它的都代表有值：undefined，null,[]
  - 有值，代表当前这个synchronism context下，这个hook需要走updateXXHook，并且使用这个值作为初始值

