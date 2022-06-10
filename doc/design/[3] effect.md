# 副作用

解决逻辑模型需要对外界产生副作用的情况，当内部状态变化，函数执行时，可以允许“订阅”相关的事件进行广播

问题：是否允许watch 状态或计算的变化，来修改另外一个状态

不允许，这种情况应该分别使用 computed 和 添加内部计算逻辑，副作用不应跟自己嵌套

考虑到复杂的情况，参考了AOP的编程思想，副作用和拦截器互相结合使用

- 前
  - 状态修改前
  - 计算执行前
- 后
  - 状态修改后
  - 计算执行后

```javascript
// 这里用effect感觉有点混淆，改成watch 或者 on ？
// 接收一个3元数组

// state1变化后，state2变化前，
// 1.这种case有必要吗？2.如果有，中间函数的执行时机是什么时候？1的变化后执行（跟没有2没有区别）还是2的变化前（跟单纯的2的变化前只有略微区别）
watch(
  [state, inputCompute], 
  () => {
    // 记录日志，双写，逻辑拦截
  },
  [state2, inputCompute2]
)

// state变化后，计算执行后
afterWatch(
  [state, inputCompute], 
  () => {
    // 记录日志，双写，逻辑拦截
  },
)
// state2变化前，计算执行前
beforeWatch(
  [inputCompute2],
  (inputCompute2Draft) => {
    // 记录日志，双写，逻辑拦截
    if (someCase) {
      freeze(inputCompute2Draft)
    }
  },
)
```

## 时机
除了常规的before和after，上述的第一个case：after & before仿佛特别少见，似乎很少有这种场景

before主要的场景是
- 拦截（停止执行
- 校验，修正参数（确保执行

after的主要的场景是
- 副作用（扩大执行的结果，不跟原逻辑耦合。如：打印日志，消息通知
- 补充逻辑（执行逻辑不够，续上。跟原逻辑耦合，且是连续的，这种情况不合理用在这里，应该在原compute里面显示的

按这个推理，after & before的适用场景就是：
- 副作用相关（副作用内处理不应影响现有逻辑
  - -> 并拦截 
  - -> 并校验
- 补充逻辑（本就不合理
  - -> 并拦截
  - -> 并校验

## after能否修改状态？

不同于可以在useEffect进行setState，after不应在内部修改

原因如下：

1.view框架因为异步渲染的feature，状态直到被使用的时候才会确定，因为渲染进行会按帧率进行拉取

但在BM，如果after能够修改State，那当下业务的“终态”就无法“主动”的确定了，因为不知道哪个after执行完后还会修改状态，那就使用“定时”的方案，这样就无法适用 as service的场景，BM就降级变成View层的模型

2.在after里能修改状态还有可能引起“死循环”的问题：

```javascript
const a = state(false)
const b = computed(() => {
  if (a()) {
    return b()
  }
  return c()
})
after((() => {
  // 在这里修改了b的依赖或间接依赖就导致循环
}, [b])
```

3.对于外部使用而言，唯一能修改BM状态应该只有inputCompute，这样对应查阅BM时心智是统一的，类似单向数据流

这样在可阅读的层面就只需要关注2个点：1.数据有哪些 2.inputCompute是怎么改的

对于after而言，内部的响应函数涉及到的state都是只读的，不会有新增写入，那就根据runtime做编译期的优化来提高性能