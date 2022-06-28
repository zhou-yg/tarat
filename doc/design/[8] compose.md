# compose

业务逻辑单元除了关注自身，也是需要能复用存量的业务逻辑，允许嵌套组合

```javascript
function serverlessUnit () {
  const b = model()
  const { a, computeA } = otherUnit()

  return { a, b, computeA }
}
```

## model compose

Model背后对应的DB也需要考虑组合的场景，组合的时候应是从DB到逻辑，再到UI的全链路组合

静态和动态有不同的逻辑
- 静态，需要版本管理
- 动态，需要版本，网络架构等基础运维层的支持


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


## view compose

view层的组合关系有2种：

- 包含
  - 包含本BM或其他BM的view
- 并列
  - 这种情况下需要声明额外的容器View，来标明他们的并列关系，对于容器而言这也是一种包含关系

面向用户展示的，view的终点都是 in Page，Page可以视作是一种特殊的View

所以层次思路就是：Page -> View1 -> View2 跟路由系统非常类似

Page可以视作特殊的一种容器，还需要额外承担渲染，所以为了实现 View in Page，有2点必不可少：

- 路由系统
  - 声明页面之间的关系
  - 排版布局
    - Layout规则（这是容器View的特性
    - 对应端的特定组成部分
      - 如：web 的 meta/title/body
- 渲染端：
  - web：SSR or CSR
  - 小程序
  - Android/iOS

### View Page区别

view可以互相引用，他们是耦合的，view可以实现组合

Page与Page是相互跳转，他们是松耦合，通过路由字符串的软连接，即Page之间不能实现组合

Page可以引用本BM或其它BM的view

Page和View需要进行概念上的隔离，如果不隔离他们的话，会产生冲突：

> 比如 visit url -> View 如果允许渲染成Page -> Page(from View) 

此时Page还是View的代码，那么这个Page到其它View的途径还是耦合的引用，不能是Page的路由字符串，冲突产生了

### Page

为了尽可能确保View层的复用特性，所以view层都是独立运行的组件

Page层只做渲染相关的：
- View -> Page 增强
- 路由系统
- 关于逻辑，只做胶水逻辑，跳转，不产生状态
- Layout相关

综合来说，Page层接近于传统”模板“的作用，薄薄的一层，后期可以通过页面搭建工具直接生成

注意Page层的收敛，便于后期转跨端

所以 View in Page的时机：

- 新增 app/ 有Page的时候一定是应用，而不是一个模块
  - 新增 app/pages/，并包含路由系统
    - 问题：views就变成了Components的作用，views的意义容易掉落，失去独立性
    - 不新增 pages，但默认约定映射 pages -> view，view增加额外配置项，参考remix
    - 问题：view具有额外的负担，功能定位有点迷惑，而且这些配置在view里是没用的
  - 其它...

[remix doc 参考](https://remix.run/docs/en/v1/api/remix#links-livereload-meta-scripts-scrollrestoration)

```javascript
// app/pages/home.jsx
export function meta () {
  return {
    charset: 'utf-8',
    title: '',
    viewport: '',
  }
}

export default () => {
  return (
    <div>
      <OtherView>
    </div>
  )
}

```
