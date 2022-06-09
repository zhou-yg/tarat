# 运行时

在常规web app里，一般原则是：client端不能直连DB，相关数据依赖server直连进行

在前面提到，数据主要是分成2类：State（内存），Model（DB）

当涉及到Model数据的CRUD，那执行数据相关的逻辑是在server side，（高级进阶：这里需要编译器的配合，能够识别出Model被使用了）

当涉及State变更，可以在 client side or server side

考虑一个极端情况：

> 也可以完全暴露DB的接口到client，让client通过接口调用CRUD，虽然这不安全，也不高效，但好处是所有逻辑都在一个地方执行，实现简单。在一般的应用，在快速启动的阶段这样搞也不是不行。

基于前面的原则，就需要识别出哪些数据是State，哪些是Model，这样才可以决定是不是要把这条draft提交到server端处理

因为BM内的函数逻辑对于框架来说是不可知的，这里需要思考清楚2个问题：
- 在client和server端执行，涉及BM的一些函数和各种监听回调
- client -> server端的过程中如何精简所需的context，做到最小化
  - 未来会碰到的衍生问题：对于超大的，以至于无法传输的context数据，能提供什么样的解法呢？

BM内会涉及到的函数，监听回调：
- computed
- inputCompute
- effect
  - before
  - after

此处应该有至少一个4x4表格，加上嵌套的存在，实际会非常复杂，可能的2个问题：
- 响应式链路的丢失，c/s/c/s 不断切换，中间可能会断
- 性能问题，即时不丢失，中间会经历多个接口请求无法停下，雪崩

下面先单独讨论

## Staet 和 Model

在有配置开关允许Model直连的情况下，情况会更复杂

没允许直连的时候，主要工作是识别Model

但不管是前端直连还是server only，Model始终都依赖远端的DB，数据更新后都需要一次query来同步最新的数据

总结：

- State
  - client & server均可，始终是当前环境即可，较为简单
- Model
  - server only
    - runtime: server
      - 因为仅能通过inputComputeInServer修改
  - client直连 手动开启配置，允许client直连，这样model就有可能跑在2端
    - runtime: client
      - UI端发起的直接修改
      - UI段调用inputCompute修改
    - runtime: server
      - 发起的inputComputeInServer的修改


## computed

computed的getter是允许异步的，这是为了能够支持到类似useRequest的效果

所以computed有4个依赖源：
- state
- model
- 外部数据，client/server独有的，如DOM api，server 内网RPC
- 其它computed

注意：computed的触发是nextTick过, 不是同步执行，所以在server端在返回时可以wait一个tick时间

computed的runtime执行环境就取决于依赖源和依赖源的组合而决定：

- 优先级1：外部数据，跟外部数据的runtime一致
  - 策略：需要开发者手动告诉框架，提供显式的computedInServer/computedInClient
- 优先级2：
  - state/model/依赖的computed
    - 策略：前computed的触发时, 上面这些state都是已经apply patches了，已经有_internalValue，所以可以直接使用，不用关心runtime
    - 未来的问题：当context是细颗粒度同步时，可能会出现computed依赖的state没有被同步，这时候要避免触发


## inputCompute

inputCompute 会修改内部状态，所以可能就涉及到Model

- 不涉及Model，可以在当前环境里直接执行（client or server）
- 涉及Model
  - 判断环境
    - current = client，提交Context，args到server
    - current = server，直接执行

在提交到server端，修改Model之后，可能又会触发computed，但是没有关系，因为computed依赖的是执行后的结果，可以在2个环境里都执行

拓展问题：
> 有些inputCompute出于特殊目的，如安全，虽然不涉及Model，是否应该也可以指定跑在Server端

### effect

涉及inputCompute的部分需要考虑，因为inputCompute可能是在不同环境执行的

这里会比较混淆，有可能涉及到了 inputCompute和effect的 client/server交叉问题

场景叠加的情况有
- server compute
  - client effect（会出问题
  - server effect
- client compute
  - client effect
  - server effect（会出问题

解决方法是得能知晓effect的runtiem属性，2个方向：
- 显式
  - 使用不同的api
    - serverEffect（仅server）
    - clientEffect（仅client）
    - effect（不限定，跟随当前环境）
  - 使用打标
    - 注解
- 隐式
  - 代码静态分析（识别是DOM，调用的类库，高难度）
  - 框架约定
    - 涉及server compute的effect，默认则serverEffect，只在server里跑
      - 问题：无法适用极端情况，即客户端直连DB，没有server的降级情况，这个时候没有server runtime
    - 不涉及server computed，则默认是在跑在当前环境


```javascript
effect([servreInputCompute], () => {
  // do something, 可能是 client逻辑，也可能是server逻辑
})
effect([clientInputCompute], () => {
  // 同上
})
```

## runner

执行BM的驱动器，因为BM基于closure，只跑一次，不需要类似Fiber的实例对象来保存当前BM的数据

但未来能够及时销毁，BM需要Scope，用来管理内部和销毁

多层嵌套的BM使用同一个scope

scope 包含release方法用以释放内存，off listener

```javascript
CurrentRunnerScope = new Scope()

run(myBMFunction)

CurrentRunnerScope = null
```
