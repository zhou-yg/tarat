# compose

业务逻辑单元除了关注自身，也是需要能复用存量的业务逻辑，允许嵌套组合

```javascript
function serverlessUnit () {
  const b = useModel()
  const { a, computeA } = otherUnit()

  return { a, b, computeA }
}
```

Context的注入和同步，参考React hooks的链表数据结构的实现细节 [https://zhou-yg.github.io/#t14](https://zhou-yg.github.io/#t14)


## Model的组合

Model背后对应的DB也需要考虑组合的场景，组合的时候应是从DB到逻辑，再到UI的全链路组合

### 静态

表结构合并，并一起初始化

还需要考虑静态合并的过程中，2个Model的Entity之间需要增加更多的Relation

### 动态

应用于基于现有系统的再拓展，旧系统仍在工作，它的数据仍有价值，动态合并可以让新系统拉取旧系统的数据

或者为了新旧系统在逻辑进行解耦，但数据需要互通