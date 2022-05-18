# runtime

在常规web app里，一般原则是：client端不能直连DB，相关数据依赖server直连进行

在前面提到，数据主要是分成2类：State（内存），Model（DB）

当涉及到Model数据的CRUD，那执行数据相关的逻辑是在server side

当涉及State变更，可以在 client side or server side

考虑一个极端情况：

> 也可以完全暴露DB的接口到client，让client通过接口调用CRUD，虽然这不安全，也不高效，但好处是所有逻辑都在一个地方执行，实现简单。在一般的应用，在快速启动的阶段这样搞也不是不行。

基于前面的原则，就需要识别出哪些数据是State，哪些是Model，这样才可以决定是不是要把这条draft提交到server端处理

## Model的关系

- State
  - client & server均可
- Model
  - server only

主要工作是识别Model

以及Model被引用的computed，inputCompute


### computed

```javascript
// 依赖里包含了Model
const computedData1 = computed(() => {
  return state.value + model.value
})
// 不包含了Model
const computedData2 = computed(() => {
  return state.value
})
```

当前computed的触发时机是内部依赖修改之后，此时依赖已经 draft commit 了，

对于 computed 而言始终是可以在当前环境里立即执行 在当前”环境“直接执行 （ client or server)

### inputCompute

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
