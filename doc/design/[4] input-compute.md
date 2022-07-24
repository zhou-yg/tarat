# 计算

有2种方式可以修改内部状态
- 暴露状态，并直接修改状态
- 提供修改状态的inputCompute

这2种应该是等价的，理论上来说直接暴露 + computed，就可以解决所有的（maybe？），可以不用提供修改inputCompute，但从现实环境来看

直接操作变量是一个单个行为，单个行为只能线性叠加。在没有inputCompute的情况下，这个单独的行为无法视作一个“整体”

除了"one"之外，"many"也需要，这样才完整。

> 原子修改，批量修改，是否还有其它的修改的抽象？？

除此之外，inputCompute作为”整体“带来的其它的益处：
- 业务语义
- 沉淀重复的逻辑（如果框架本身不提供，业务侧开发者自己也会做）
- 提供method之后，围绕method能提供更强大的feature，
  - 异常状态回滚
  - 批量更新
  - 计算的响应式，最终一致性

## 直接修改

顾名思义

```javascript
const state = new State()
// style 1
state.value++
// [recommend] style 2，显示调用
state.update(state.value + 1)

```

## 内部状态之间的计算

除了直接声明的数据，还有一些数据是由通过原数据 + 计算得到的，类似响应式数据的 computed

这类数据通常会声明一个计算函数

```javascript 
const computedData = computed(() => {
  return state.value.allow ? cache.value.welcome : model.value.deny
})
```


## input-compute

一个函数的method，接收参数并手动的计算，最后统一的修改状态

inputCompute，修改状态的函数，根据 入参 + 外部数据 + 当前状态 = 最新的状态

虽然在web应用这里不可避免的依赖异步数据，但在设计思路来说，即时支持了异步和外部数据，对于逻辑模型来说，它依然可以拥有部分”纯“函数的特性

inputCompute内部特性
- 内部访问到的状态数据均为“draft”
- 函数的Context内，收集draft的修改信息
  - type draftPatches = Array<[ path, value ]>
- 状态的更新时机
  - 函数正确执行完成后，才update到源数据
    - 执行过程发生了异常处理，不执行update
  - 一边执行一边update（确定是否必要？）


当inputCompute执行内部函数时，需要标记当前的Context

```javascript
const computeState = inputCompute(async (args) => {
  stateA.update(stateA.value + 1)
  
  const r = await fetch(stateA.value)

  cacheB.update(r)
})
```

## 对比React的onClick

React的onClick里可以直接setState呢？为什么inputCompute第一时间不考虑这个

我理解View框架的渲染是一个异步过程，虽然setState执行了并更新内存里的状态，但由于渲染的帧率问题，此时界面没更新，内存状态并没有被“用到”

内部状态的消费是被动的过程

即只有render发生时需要调用getState去获取状态，拼接成最新的dom树进行渲染，这是渲染和视图相关下才会有的计算数据逻辑

而inputCompute是服务于driver, 在计算的执行完结之前，单独的应用个别状态”没有意义“，意义只在于整个计算完成后才会产生，所以这个时候update(draft)才是完整的

其次是考虑到as service的场景，逻辑上，一个函数调用不能返回2个返回值，同理接口不能处理到一半就返回部分结果（不考虑Content=chunk分块）

但是最后还是在设计时，还是这个考虑这个特性，适应极端场景，也许真的有接口需要处理到一半就返回结果，例如获取执行进度之类的？

毕竟现实里一个函数调用真的可以返回2个返回值



## inputCompute for server

在以一个application启动的情况下，手动标记了server，应优先提交到server执行

提供显式的api：inputComputeInServer ，表示这个函数逻辑只在server端运行

## http header问题

由于 inputCompute完全屏蔽了http，那无法实现往header里写cookie的这种操作呢？

- 暴露ctx，作为参数到inputComputeInServer里
  - 问题：怎么支持后期的经过AST分析自动化处理后的ic里，那时候默认可以不需要显式的inputComputeInServer
- 提供server/writeHeader 这种api，仅允许在显式的inputCompute里调用
  - 问题：不能用全局钩子，因为inptuCompute内部可以是异步执行的，到writeHeader时，全局钩子可能已经被其它请求覆盖了，有并发的问题