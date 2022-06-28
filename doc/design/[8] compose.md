# compose

业务逻辑单元除了关注自身，也是需要能复用存量的业务逻辑，允许嵌套组合

```javascript
function serverlessUnit () {
  const b = model()
  const { a, computeA } = otherUnit()

  return { a, b, computeA }
}
```

## Model的组合

Model背后对应的DB也需要考虑组合的场景，组合的时候应是从DB到逻辑，再到UI的全链路组合

### 静态模式

表结构合并，并一起初始化

还需要考虑静态合并的过程中，2个Model的Entity之间需要增加更多的Relation

### Relation增强

Model x Model时，静态它们之间的表还是只是简单的线性增加，如果想进一步加强联系，必须加入更多的补充说明

```javascript
// enhanceRelation.js
enhanceRelation = [
  {
    from: {
      entity: 'Entity1',
      field: 'field1',
    },
    to: {
      entity: 'Entity2',
      field: 'field2',
    },
  }
]
```

### 动态模式

应用于基于现有系统的再拓展，旧系统仍在工作，它的数据仍有价值，动态合并可以让新系统拉取旧系统的数据

或者为了新旧系统在逻辑进行解耦，但数据需要互通

动态模式下不能使用Relation增强，而且动态模式下，由于数据库不受当前系统控制，有可能会出现

业务逻辑代码 和 底层DB脱节的情况了

> A系统 <- B Hook <- B DB（此时DB进行更新了），但A系统没感知到

除非也是类似于 Client/Model的模式，通过Context进行同步

> A系统（内含B state) ---> B Hook.inputCompute --> B Server.inputCompute --> B DB --> B response

这样对应A系统而言，使用B Hook在实际里是更接近于请求库，但还是有跨版本的风险，比如B Hook返回了不兼容的数据，

所以应该设定版本号规则，和 版本号校验，参考开源库：v0.0.0

- 第一个数字是大版本、break change（校验不通过，提示必须升级）
- 第二个数字是新功能升级，只增不减
- 第三个数字是bug修复

基于版本号规则和校验，在网络架构了，应始终保留部分旧版本机器，在负载均衡的校验版号，以支持新/旧情况的过渡

这里还得考虑下是前后数据逻辑不兼容，需要停机更新的情况

## 引用方式

静态和动态有不同的逻辑
- 静态，需要版本管理
- 动态，参考上述，需要版本，网络架构等基础运维层的支持

