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

默认是都是响应式的数据，默认以 @vue/reactivity 为例

> 如何解决二进制文件数据？

## State

最基础的内存数据，接收一个数据（应为响应式数据

```javascript
class State {
  construtor (value) {
    this.internalValue = value
  }
  // draft和events见下方
  update (draft, events) {
    // 精确更新
    events.forEach(([path, value]) => {
      lodash.set(this.internalValue, path, value)
    })
  }
  get value () {
    if (Context.inputeCompute) {
      return produce(internalValue) // draft
    }
    return this.internalValue
  }
}
const state = new State(reactive({
  name: 'zhouyg'
}))
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
  async afterUpdate (draft, events) {
    const newData = combineEvents(events)

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

