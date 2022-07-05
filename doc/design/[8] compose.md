# compose

BM是一条纵线，在完善了自身功能逻辑的情况下，最重要的便是能被充分复用

复用可以视作跟其他BM在 View/Hook/Model层（类似于传统的MVC架构）的两两连接，进行按需组合

同时明确在组合的时候要明确组合的类型，时机方式：
- 类型
  - View
  - Hook
  - Model
- 时机
  - 动态运行时
  - 静态编译时

根据上面的3大项的笛卡尔积之后，总计最多有 (3x3)x2=18 种情况

再加未来可能还有更多的选项加入，所以在思考组合时要面临一个非常复杂的网络

但好在有些组合条件显然是不合理的，所以可以稍稍降低一点情况

## 协议

当 BM compose another BM，当前BM的 server framework 需要知道哪些BM被引入了？

方式有：
- 依赖检查
  - 说明：根据特定的pkg名称规则（如：tarat-bm-xxx） 或 packageJSON.tarat 字段
- 手动声明
  - tarat.config.js#compose字段中加入被组合的npm pkg名称，较为繁琐，适用于特殊场景：开发阶段，

## 时机

有2个时机：编译，运行时

运行时和编译时最大的差别在于，声明关系的时候是运行时获取的，还是编译先确定的，这里取决于类型本身和用户开发体验

比如
```javascript
// BM2
function hook1 () {
  const s = state()
}
// BM1
function hook1 () {
  const h2 = useHook(hook2)
}
```

在编译BM1的时候，直接把 useHook(hook2)的部分作为静态代码整合进去，对于消费者，得到的就是一个完成的BM1产物，里面也包含了BM2.hook1代码

如果涉及到了model，那么在初始化时，显示的提供指令，将依赖的静态BM的prisma.schema进行组合再拼装，生成到当前BM models中

这是编译时，也就对BM的代码层面的复用

比如 
```javascript
// BM2
function View2 () {
  const hook = useHook(hook2)
  return <div></div>
}
// BM1
function Page1() {
  return (<View2 server={{ server: 'https://127.0.0.1' }}>)
}
```
在上面的例子里，访问 /page1 时，View1会运行时的渲染View2的，在SSR的模式下，Page1要进行有效的渲染，必须先执行View2，再执行hook2，

执行hook2的时候，并不是时机执行hook2内的代码，只是在执行一个api proxy

这是运行时的组合时机，在逻辑层是对已经在线的服务的复用，UI层还是代码的复用

## 组合枚举

- model
  - model 
    - 静态
      - 场景：当前model1可以直接引入了model2的结构声明，并补充关联关系
    - 动态
      - 问题：当前model1无法直接跟remote model2直接建立关联，这个场景在model层就无法实现，需要借助hook
  - hook
  - view
    - 问题：model不能反向组合hook，view
- hook
  - model
    - 静态
      - 场景：同model的静态组合
    - 动态
      - 场景：可以调用remote model的，只要配置好链接和权限，同常规的server框架调用DB。但在这里还可以有更好的方式
  - hook
    - 静态：
      - 场景：常规的hook2引入，可以使用hook2的内部状态和方法，同时在组合hook2的时候默认会静态组合model
    - 动态：
      - 场景：remote hook调用，类似于现在的服务调用，配置好远端地址，权限等
  - view
    - 问题：要想清楚hook驱动view渲染，还是view内部订阅消费了hook。只要前者的情况下，才能有hook->view的组合
- view
  - model
    - 问题：view层不能直连操作model，所以没有
  - hook
    - 静态
      - 场景：直接引入hook2 as lib，正常使用
    - 动态
      - 场景：远端加载动态hook，用配置项 替换 代码导入
  - view
    - 静态：直接引入view2 as Component，正常代码开发使用
    - 动态：远端加载，类似于iframe或微前端的动态加载，用配置项 替换 代码导入
  
通过上面的 4 + 4 + 2 = 10 总结一下，组合是有序的，只能组合当前层或下一层者： 

- view -> view, view -> hook
- hook -> hook, hook -> model
- model -> model

即： 1.view -> 2.hook -> 3.model


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
// models/prisma.enhance.json
[
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



## hook/model compose

### hook -> model
静态的，首先是依赖于model间的静态组合，下层model组合后，这里hook就只能直接在model里使用

动态的，类似于传统MVC架构下，service层连接DB并调用，

所以这里需要像传统架构那样，提供远端连接

有2个问题需要注意：
- 远端model存在的问题是会丢失prisma schema信息，需要同时import 远端 prisma client
- DB 连接池的问题

```javascript
function BM () {

  const m = model('items', query, {
    url: 'mysql://root:123456@localhost:3306/db'
  })
}
```
### hook -> hook2

静态的，常规的库导入即可，在导入的时候注意 hook depsMap的初始化

动态的，远端调用hook2的“接口”，在使用的时候，需要import对应hook来作为调用库使用，

在消费远端hook时的模式时，也是通过同步context来完成，通信层面确保跟调用hook的通信方式一致

当消费远端hook的时候，逻辑应该是阻塞的，需要等待返回后才能进行下一步, 同时在频繁获取时会有异步时序的问题

注意：这跟现在的同步computed，异步获取再更新的过程有点冲突

为了性能考虑，在消费远端hook时应该能识别当前hook会使用到的具体属性key，确保没用到的key不会产生额外的计算

## view/hook compose

通常是在页面渲染 SSR 和 CSR的时候用于获取数据并渲染，直接或间接的借助hook获取数据

### view -> hook

静态的，动态的 都均如同 hook -> hook

因为目的是一致的，为了获取数据


### view -> view

静态的，import常规的UI组件一致，正常使用

动态的，相对复杂

view需要下载ui组件需要才能进行渲染，但是在远端的view里也可能会包含hook，

在这个情况下：view1 -> dynamic view2 -> view2 static hook2

当中的view2的静态hook2需要转变为动态hook2


## page

Page可以视作特殊的一种容器，是组合多个view并作为渲染, 还需要额外承担渲染，所以为了实现 View in Page，有2点必不可少：

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
