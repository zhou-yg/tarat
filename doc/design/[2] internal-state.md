# 内部业务状态

作为描述业务逻辑的起点，首先内部按照“存储”特性，和”重要性“分为3种：
- State
  - 特性：读写快，每次都清空
  - 内存
- Cache
  - 特性：读快，写快，没有锁，持久存储，但允许丢失
  - 缓存 （取决于依赖的数据链路的下游的是否为Model，决定
    - 否，客户端
    - 是，服务端
- Model（
  - 特性：读快，写可以慢，有锁，持久存储，不允许丢失
  - 数据库

默认是都是普通数据，通过显示的update进行数据更新，和 监听通知

> 如何解决二进制文件数据？

## State

最基础的内存数据，接收一个普通数据（如果是响应是数据，应进行toRaw处理）

后面去掉“响应式”的原因是

响应式库本身就自成身一体的，，在BM里的响应式部分在于，state本身，而不在于它的value部分，所以这个意义将BM跟reactvity之类的响应式是并列关系，不是可以二次封装的关系

BM内部本就需要通过immer来收集patches，再根据patches来前后判断，数据的修改情况，并手动调用update，所以响应式的意义就不大了

即BM来说，是只有有限的响应式结构，即state,cache,model，等同于@vue/reactivity的 ref增强版，所以是并列关系

所以后续的基于reactive的computed，也是同样需要基于State的机制再实现一层，不能使用现有的框架

<!-- 变成了响应式数据的时机？
- constructor中reactive
- get value时reactive 

State可以视作一个大ref, 那如何监听数据？ （ps：如何区分是否shallow
- construtor中增加watch
  - 前提：必须已经是在constructor里reactive，才能监听到
- get value中增加watch

区别在于是否要lazy？
- 是，每次get value都是新reactive对象，外面就无法修改被用在computed里的这个变量，等同于无法watch，必须手动构建watch方法
  - example: effect(() => reactive(obj)); change new reactive(obj)  wont trigger effect callback
  - solution: effectSelf(() => readonly(obj)), add subscripe relation, then change new reactive(obj) trigger watchSelf -> notify effectSelf
  - conclusion: 过于复杂，后续考虑这个优化
- 否，每次get value都是同一个reactive对象，可以直接使用effect作为watch

另外增加watch会有性能开销，是否可以在执行时自动merge，一次watch？（后续考虑）
> watch(hook.memoizedList)  -->


```javascript
class State {
  construtor (value) {
    this.internalValue = value
  }
  // draft和patches见下方
  update (draft, patches) {
    // 精确更新

    // [
    //   { op: 'replace', path: [ 'age', 'num' ], value: 3 },
    //   { op: 'add', path: [ 'age', 'v2' ], value: { v2: 2 } },
    //   { op: 'remove', path: [ 'name' ] }
    // ]
    patches.forEach(([path, value]) => {
      lodash.set(this.internalValue, path, value)
    })
  }
  get value () {
    if (Context.inputeCompute) {
      return produce(internalValue) // draft
    }
    return reactive(this.internalValue)
  }
}
const state = new State({
  name: 'zhouyg'
})
const state2 = new State(1)

```

## Cache

从State拓展来的，Cache的逻辑在于当内存数据发生改变时，双写一份缓存，缓存在这个业务场景里主要有2个目的：

- 改善交互，“记住”用户操作行为，减少重复交互工程，提升页面加载的性能
- 提升性能
  - 提升响应速度，读缓存比读Model快
  - 提升系统的吞吐量，降低Model的负载

更新策略：乐观策略，不阻塞

先更新内存，再写入Cache

```javascript
class Cache {
  construtor (value) {
    this.update(value)
  }
  // 调用 this.update之后
  async afterUpdate(v) {
    writeCache(this, v)
  }
  get value () {
    this.updateFromCache()
    if (Context.inputCompute) {
      return produce(this.internalValue)
    }
    return this.internalValue
  }
  async updateFromCache () {
    const cacheValue = getCache(this)
    this.internalValue = v
  }
  clearCache () {
    clearCache(this)
  }
}
```

##  Model

核心，数据来源为数据库，这里以 Prisma 为例。

跟Cache即是替换关系，也是依赖关系

初始化读的时候应该指定对应的 Entity 和 查询语句，跟数据库建立映射关系

当数据变化的时候，根据变化的特性(create，update，remove)发起操作，将数据写回数据库

- 读
  - Entity
  - QueryParameter = { where: {}, include: {}, select: {}, take, skip }

- 写
  - create
    - 时机：当数据为空或where索引为空时，并且设置了新数据，
  - update
    - 时机：当数据修改时，且不是create，发起update操作，精确的更新被修改的field
  - remove
    - 时机：当数据被清空时，并且显示地调用了remove，则进行remove操作


combinepatches需要考虑的，在提交数据patches到server side之前，需要提前处理数据的新增和删除的情况：
- 删除
  - 列属性，set prop=null，这样对于数据库来说才是删除列，等同update
  - 行数据，需要调用remove（支持批量
- 新增
  - 列属性，拼完数据，如果已经存在列数据，等价于调用update
  - 行数据，需要调用create


在有server的情况下，处于安全考虑，所有的model都应该在server端完成“修改”

但客户端结构里的情况下，比如client能访问到代理后的server操作（或者client本就能直连数据库），那就可以在client端完成"修改“


```javascript
class Model {
  construtor ({ entity, query }) {
    this.entity = entity
    this.query = query;

    this.execute()
  }
  async execute () {
    // query有可能依赖了其它的State，需要先预处理下
    const query = resolveReactive(this.query)

    const result = await abstractModel.read(query)

    this.internalValue = result
  }
  // 默认乐观更新，after update method
  async afterUpdate (draft, patches) {
    const newData = combinepatches(patches)

    const ids = await abstractModel.createOrUpdate(mergeDataToQuery(this.query, newData))
    
    // 如果是非乐观更新，则等数据库更新成功后再将new Data写回内存
  }
  async afterRemove (force) {
    if (force) {
      // 清除时同步清理数据库
    }
  }
  get value () {
    if (Context.inputCompute) {
      return produce(this.internalValue)
    }
    return this.internalValue
  }
}
```

### 替代Cache

将Cache升级为真正持久化的存储，此时在数据更新时，原本读写Cache替换为读写Model

代码逻辑同上

### 依赖Cache

将Cache作为Model的防护层，这就涉及到缓存和数据库的更新策略，按照常规分布式架构的架构设计，保持最终一致性，策略一般：

先更新Model，再清理Cache。当有读操作时，发现没有Cache不存在，则读取Model同时写入Cache（写入Cache时按照Cache自身的策略实现）

这现有实现的基础上，需要额外增加Cache进行读写（感觉可以有一点“巧妙”的设计，让Model能完全复用Cache的代码而不用重复写）

```javascript
class Model {
    construtor ({ entity, query }) {
    this.entity = entity
    this.query = query;

    this.execute()
  }
  get value () {
    return this.internalValue.value // Context.inputCompute会在Cache里判断
  }
  async execute () {
    // query有可能依赖了其它的State，需要先预处理下
    const query = resolveReactive(this.query)

    const result = await abstractModel.read(query)

    this.internalValue = new Cache(result) // 引用了个Cache
  }
  // 乐观更新策略，这里有调整：原本是内存修改 -> 写入缓存，=（变成）=> 内存修改 -> update DB -> delete Cache
  afterAfterUpdate () {
    // 上面的Model.afterUpdate之后 
    this.internalValue.clearCache()
  }
}
```



### client model

client model不执行具体变更，会把patches post到当前的服务器，服务器地址信息可在build时配置

这是在build时需要关心的概念，默认Model的数据在计算可以在 client/server进行，但Model的执行变更必须在serve

所以在编译产物里则有 model 和 client model的差别

考虑到BM可以在多个地方时，默认提供的是model版本，

如果以默认的application来使用，则在页面里默认使用的是client model，可以加个配置来强行禁止


### patch到diff

找到diff的目的是为了最终的数据库ER操作，所有的操作都是基于每条数据，所以最终都落到具体的object

特例：deleteMany/createMany 批量的场景才需要考虑用到 array，这时候array也是当作单独入参来使用，还是没逃脱出object的范畴

patch里都是细化化的操作，没有updateMany

patch的类型包含： replace, add, path 

按path找到对象，合并操作，因为是计算diff，所以可以不考虑原对象，而且所有draft的操作都一定是从根路径出发，所以一定能找到对象

Draft只会是2种形式：object，array。array可以看着是带数字下标的object，所以可抽象成1种：object

先通过 path -> 找到 { } -> 进入递归 ，直到只有一个path，判断op

- replace：赋值，是更新逻辑
  - 有可能修改的关联关系对象，最后执行diff的时候，entity也可能是关联关系的entity
- add：在obj上增加属性，增加的属性有可能是obj，那这里可能会涉及到 关联关系的处理，如果存在relation关系
  - 如果增加的obj 有 id，说明是addRelation，确认是否需要在原本的query参数里需要加入 include: { obj: true } 
  - 如果没有id，说明要先create，再addRelation，再改变query参数
- remove：删除对象，或删除属性
  - 删除对象，如果对象存在id，且本身是entity，或者关联关系的entity，则执行remove操作
  - 删除属性，如果当前对象是entity且有id，则是update操作，并且set prop = null
   
将上述的判断结果放到待执行的stack（update，create，remove），并且要判断，按顺序并合并stack

合并策略：
- 最后是remove的stack里的obj，不需要再update和create。
- 如果是先create再remove，它们就可以都不执行，但这种情况应该不存在，因为如果没create过，remove里面是没有id的

那种需要基于关联关系进行的消费的数据怎么解，比如要先create拿到id，再把id拿去关联其它数据？但这种场景应该也不存在，因为如果是关联关系，可以看add那里，如果没有关联关系

那就不推荐这种使用方式，这应该要约束。如果是跟外部系统联动，那可以用effect。effect里也许可以透出差异的信息

补充说明：在实际实现里，由于没有ER的相关信息，所以在diff中只能指出这是一个嵌套对象，不能确实是关联关系

### model的全局性

model是DB到逻辑单元的数据映射，所以理论上所有基于model的数据或渲染应该是时刻依赖其最新的数据

判断是否是相同model的条件可以有2个：
- entity 表
- query条件
  - 问题：在实际上执行中，即时是相同的逻辑单元，它的query条件也不一定相同。其次是哪怕是不同的query，他们也可能会受到相同的数据增减的影响。比如最简单的一个是取0~5条，一个是取5~10条，这时候插入了第0条
  
所以理论上只能依赖 entity，并且当entity变化时即时query

model可能涉及到关联entity查询，那么当其它逻辑单元里的涉及到了 关联entity的变化

model的关联entity也需要重新查询，可以通过关联查询和关联关系字段，仅查询关联entity即可

> model(A -> B)

上面涉及的2个重新查询可能会引发有性能问题，所以需要提供开关允许用户关闭，也许有些数据没有那么实时也可以

```javascript
function hook() {
  const m = model(() => ({
    entity: 'Model',
    query: {
      where: {
        id: 2
      },
      select: {
        childEntity: true
      }
    }
  }), {
    realtimeQuery: false, // 当false时, 则默认realtimeRelationQuery也false
    realtimeRelationQuery: false
  })
}
```

### model的订阅关系

上述说到model的query条件不能能用相等来判断，但从另一个角度来看query可以视作是model对DB的一种订阅

query就是订阅条件，类似于computed对于state的订阅，query是state的属性key path

当然query的订阅条件是可以的非常复杂的，至少要分成2个部分讨论：
- entity本体的query
- 关联的entity的query

query查询通常有2类：
- 基于属性的查询
  - 精确查询 where={ name: 'xx', age: 'xx' } 或者空
  - 模糊搜索 where={ name:{ like: 'xxx' } }
- 基于属性的计算查询，排序，count，取最大/最小，前几/后几
  - 这种可以视作基于前2种查询的结果的二次取值，基于排序的，基于结果长度的

可以得知查询总是依赖于属性和属性条件，那么当query的时候就可以将查询依赖收集并作为一种监听，如同computed

```javascript
// hook1.js 中
const m1 = Model.query({
  entity: 'user',
  where: {
    name: 'xx',
    age: {
      gt: 10 //调用函数判断
    },
  }
})
// hook2.js 中
const m2 = Model.query({
  entity: 'user',
  where: {
    age: {
      lt: 10 //调用函数判断
    },
  }
})
// 依赖映射
EntityUserDepMap = {
  {
    name: 'xx',
    age: {
      gt: 10
    } 
  } -> m1,
  {
    age: {
      lt: 10
    } 
  } -> m2
}

Model.create({
  entity: 'user',
  where: {
    data: {
      gender: 0,
      age: 9, 
      naem: 'xx',
    } // 这个data可以match到2，match不到m1，因为gt条件不符合
  }
})
```
create的时候就需要遍历 EntityUserDepMap 找到符合条件订阅的Model，然后针对性的对Model进行更新

通常情况下数据查询做的时候是 根据查询条件 -> 符合条件的数据，（update的情况会比较复杂，需要考虑同时考虑 where和data的2个条件）

但这里却反过来，通过变更的数据 -> 检查是否符合条件，这是逆向的过程，

所以这个逆向查询的实现难度应该不亚于"正向的查询"，也具备非常大的实现难度和成本。

好消息是逆过程的数据量通常是单条，而且检查逻辑是在client端，在实现的时候可以不考虑“性能“问题

按某种经验主义，程序方案一旦可以不考虑”性能“问题，往往会降低非常多的难度

### model的指令操作

在处理Model数据的时候，有些其实可以完全不依赖已经读取的本体，比如push操作

如果可以识别是push并且在inputCompute里已经没有后续对本体的其它单元的读写，那么这个长列表的就不通过context传输

所以在Model可以提供一系列的指令集：
- push/unshift 新增，但这倆需要注意的是跟query的查询排序是否冲突
- exist 查存在，重复性

这里的指令操作跟数据库的关系代数操作有一点点的冲突，比如splice，在mysql DB里没法实现一个中间插入

所谓的顺序是查询的顺序，这里要做的事情其实是 数组 <-> DB之间要做一个完全的自动映射，必须是精心维护一个规则

以排序为例：一定会有一个排序条件 model.query = { ..., sort: ['desc', 'index'] } 

那么当给这个model插入一个指定位置的数据时：model.splice(2, 0, {...})，

这个时候可以不用指定index属性，可以根据前后的index值计算得到：

> index = (preIndex + nextIndex) / 2

另外一种算法时：获取DB这个字段的类型，如Int，Float，Date

如果是Int那就只能最小加减1，如果是Float，那就根据DB引擎 加减一个最小的Flaot值,0.0001之类，如果是日期，就加减1毫秒

这里得到的index值可能会有问题：因为index如果是Int类型，且前后是刚好差1，那得到的新index就是小数了，insert数据库就会失败

补救的方式可能就是：整张表全体列+1，十分暴力

还有考虑的地方是插入头部和尾部，头部也要根据数据类型，比如Date就是当前最新值，其它数字类型就是加1个最小单位

总之一旦涉及到“自动”，边界和复杂度就分分钟爆炸