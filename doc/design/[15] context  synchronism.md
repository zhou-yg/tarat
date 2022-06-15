# Context状态同步

同步context遇到的一些问题

## M,S顺序

由于Model中有可能依赖了State的值，并且如果Modeol是immediate的。Model会由于使用了初始的State的，导致查询出了不预期的结果

示例:
```javascript
// hook
function h () {
  const s1 = state(1)
  const s2 = state(2)
  const m1 = model(() => ({ entity: 'e', query: { s1: s1(), s2: s2() } }), { immediate: true })
}
```

所以在初始化Hook的过程中就必须注入context，同时在state实例化的过程中如果当前scope存在值，则使用当前scope的值.

> 拓展：是否需要类似react hook的过程中，拆分成2类hook：mounte，update ？是，可以节省性能

参考[react的hooks实现](https://github.com/facebook/react/blob/79f54c16dc3d5298e6037df75db2beb3552896e9/packages/react-reconciler/src/ReactFiberHooks.new.js#L2827)

## M的2次执行

还是 immediate的Model，当client初始化时，model也需要查询数据，当在客户端里无法查询到，所以会callhook到server的Model中，所以在此时也触发了Server中的Model的初始化

由于代码是相同的，所以Server的Model也会immediate的执行query，并且在执行时，由于被callHook了，所以这个Model会再执行query，最后现象就是需要被同步的Model会执行2次

### N次计算

有点复杂，不能单纯的在Server端禁止掉immediate（虽然这能解决问题），因为这种不一致的执行逻辑，会引发很多意向不到的效果，这里需要思考的是如何保持hook的初心，即context对cleint/server的无感同步，尽量通过runtime的机制来解决

这个问题本意是由于client Model不能直连数据库导致的model缺失（以及也会model的关联数据缺失）导致它实际的目的是，基于当前context向server side请求一次“同步”

还在之前通过inputCompute已经解决了 client基于当前context + 一次计算的同步问题

所以这次的问题就是基于当前context + 0次计算的同步

在后续拓展里应该可以通过batch的方式，通过当前context + N次计算的状态同步，如果N次计算的过程可以包成纯函数的情况，

上述的N次计算有点之间本来也可以在hook内提前封装好，但有可能没法穷尽所有的外部调用情况

batch提供的是一种基于N次计算之间，可以快速在server端执行的快捷封装，

可以应用于：跨BM的组合，二次封装

### batch方法

```javascript
batchInputCompute(async () => {
  await hook1.icMethod()
  await hook1.icMethod2()
})
```


## 细粒度的context

现在之所以是全量传输是因为无法提前预知到在inputCompute内会直接的使用到哪些state

能在运行之前就得知一个函数即将会使用哪些state，那么优化的手段就只能是AST静态分析了

inputCompute内修改state后可能会引起连带的响应式反应，这个没有关系。这个场景只发生在client -> server

可以在server端完成后返回到client，让client继续去触发后续的computed和effect

这个解法唯一可能存在的问题： inputComputeInServer -> state -> computed（只有client端的会响应） -> afterInServer（此时server会响应不到）

## 依赖关系

在CSR或SSR中，其中一个端一旦初始化之后，依赖关系引用就定下了

其中唯一不确定的是computed可能会由于if条件没收集到，但computed一旦执行就又可以收集到最新依赖，再同步回context即可

通过将 depMaps 和 contextData 一起传输，可以减少另一个端的执行Hook执行。

> 这里需要评估对比“多出来的depMaps” 和 “重新执行hook” 到底哪个损耗大？
