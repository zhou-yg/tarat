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

### 支持的数据源

分client和server，应该支持的是不同的cache数据源
- client:browser
  - localStorage
  - sessionStorage
- server
  - cookie
  - redis

应该类似于数据库配置，cache能支持的数据源也以插件的形式来拓展，可参考[immer插件](https://github.com/immerjs/immer/blob/master/src/core/immerClass.ts#L123)
