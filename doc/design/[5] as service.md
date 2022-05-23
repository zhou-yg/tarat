# api 服务器  

在思考BM的时候，会下意识的将这个模型 treat as state model

但问题是，如果将这个模型应用 api server 的场景里的时候就产生冲突

因为现在的web server都是基于stateless application的思路来设计的，对于web server来说

数据来源有3个地方：
- 入参
- 缓存
- DB

不能依赖本地的内存数据，是因为要考虑多实例，分布式的部署，扩容，也由于这个特性使得server扩容非常容易，导致了提供数据的DB就成了系统的性能瓶颈

衍生拓展：对于DB的性能瓶颈问题也衍生了各种各样的分布式的数据方案，to be continued

## 接口

由于web server是无状态的，每次需要执行特定业务逻辑的时候，都需要从外界获取数据源经过计算返回结果

所以从这个方面，一个web接口也接近“函数“的特性：入参 + 计算 = 结果，更新DB或缓存则是”副作用“的另一种表现

相比于传统的web server framework，like Java spring, Node nest.js, egg.js

这些框架都是围绕暴露的接口去设计，一个接口就是一条逻辑，独立性强，这也造成通过代码去理解原始需求的困难，因为经过拆分后，接口之间的调用顺序，逻辑关系都是隐式的。维护在前端，产品手册，个人经验里

在BM中要做的则是全部接口汇总到一起，显示的关系。inputCompute作为 传统Server的外部接口提供

在逻辑设计上，实际代码实现有个差别：
- 设计：先用BM，再有接口
- 实现：根据入参path，加载指定的BM，并调用相应的方法

```javascript
function serverlessUnit () {
  const computeState = inputCompute(async (args) => {
    stateA.update(stateA.value + 1)
    
    const r = await fetch(stateA.value)

    cacheB.update(r)
  })
  return {
    computeState
  }
}
// 外部调用
request('/api/serverlessUnit/computeState', Context, args)
```

## 双端同步

但由于server stateless的特性，除了相比传统的接口，其实还多了个依赖
- 入参
- 缓存
- DB
- 【新增的】当前状态Context

传统的解决方法是上一个接口处理完，会将这些状态返回到前端或写缓存，然后再一个接口里需要前端作为参数回传或者读缓存。

也种处理方式也增加了一些现在前端的开发负担，是不完全的分离

但在BM里，这部分逻辑可以自动处理掉，因为作为一个整体的BM，逻辑始终只有一份，只是运行环境不同

- 对前端
  - 调用接口除了提供入参，还需要上传Context
- 服务端
  - 接收的有
    - 入参
    - 状态Context
  - 执行结果
    - 部分状态被修改，commit draft，重新获取Context并返回

思考一个问题：Context的上传和返回是否只按需传输，不用传完整的？

结合考虑computed的存在

- 按需要传输
 - 那么在Server端就不能commit draft，需要在前端 commit draft，然后才能引起其它的关联状态的变化，并且computed内不能有异步的服务端数据逻辑或Model，这种结果是draft在server端产生，在前端合并
   - 好处：节省技术，减少传输
   - 不足：依赖前端，依赖约束
- 完整传输
 - 可以在Server端commit draft，这样就能在Server端执行 关联状态的computed，computed也可以有异步服务端数据 和 Model
   - 好处：适应强，约束少
   - 不好：计算负担，传输负担

好像没有明显优劣之分，也许可以作为一种性能优化的手段来提供

```javascript
// 调用
const Context = [ stateA, stateB ]
request('/api/serverlessUnit/computeState', Context, args)

// server side
function handler (Context, args) {
  const unit = init(serverlessUnit, Context) // 重新初始化，并注入
  await unit.inputCompute(args)
  return await unit.getResult()
}

```

## 2个问题
1.每次都同步Context，如果是大体积的Context是否会有性能问题

可以参考qwik的实践，qwik的lazy loading每次都是从server动态load js文件片段，比单纯的Context大多了，所以这方面应该不是问题

2.链路每次都重新初始化

在RPC链路里，大部分耗时在IO上，程序本身的执行逻辑几乎可以忽略（除非内存泄露，爆栈），而且参考eggjs的实现，在业务层代码之前会初始化非常多的基础逻辑也没问题

对应web server来说，由于要确保无状态和高性能，每次重新初始化虽然会有开销，但独立的context下可以确保代码不受干扰，提升可维护性。之前的web server甚至每个请求都会一个新进程来处理请求