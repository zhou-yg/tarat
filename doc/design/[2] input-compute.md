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

一个”纯“函数的method，接收参数并手动的计算，最后统一的修改状态

inputCompute，视作状态的”纯“函数，根据 入参 + 当前状态 = 最新的状态，

虽然在web应用这里不可避免的依赖异步数据，但在设计思路来说，即时支持了异步和外部数据，对于逻辑模型来说，它依然可以视作拥有纯函数的特性

inputCompute内部特性
- 内部访问到的状态数据均为“draft”
- 函数的Context内，收集draft的修改信息
  - type draftRecords = Array<[ path, value ]>
- 状态的更新时机
  - 函数正确执行完成后，才update到源数据
    - 执行过程发生了异常处理，不执行update
  - 一边执行一边update（确定是否必要？）



```javascript
const computeState = inputCompute(async (args) => {
  stateA.update(stateA.value + 1)
  
  const r = await fetch(stateA.value)

  cacheB.update(r)
})
```