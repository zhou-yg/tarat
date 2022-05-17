# as service

在思考业务逻辑模型的时候，会下意识的将这个模型 treat as state model

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

这些框架都是围绕暴露的接口去设计，一个接口就是一条逻辑，独立性强