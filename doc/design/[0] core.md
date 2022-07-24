# 世界观

> 名字 tarat (同tarot，中文名：塔罗)

基于依赖追踪的范式，纯粹的，描述的业务逻辑执行模型（不限语言，环境），write once run any where

> 参考： remix, solid-js,qwik，nextjs，dva，redux，react hooks，axii，vue setup，Proxy, event sourcing, immer

- 内部状态是响应式，状态，计算的叉乘组合
- 模型是一个计算整体，只有外界输入才能改变内部状态
- 计算和内部状态会产生的副作用，但不能返过来

基本概念
- application: 一个完整应用，include below, serve it's busness at first. don't need to consider reuseable
- module: 一个包含driver/view/model的完整业务单元，可在tarat内进行静态/动态 复用
- driver: a centeral description，包含了多个reactivity api 以及他们的关系
- model: 特指持久化层的数据存储，如DB
  - cache：缓存系统，介于持久化层的中间层，用于解决特定场景下一些性能问题
- reactivity api: 描述逻辑的基本单位，包含几类：
  - state: 状态，可读写
    - model: extends to state，是model层在reactivity api中的实现，包含CRUD
    - computed: 计算属性，外部只读
  - inputCompute: 批量修改state/model


```javascript
// V1
const serverlessUnit = {
  context: {
    a; new State(),
    b: new Cache()
    c: new Model('Entity')
  },
  init () {
    // init body
  },
  inputCompute: {
    inputCompute (arg) {
      const deps = init(contextDraft)
      // middle state ?
      return { result: newResult } 
    },
  },
  effect: {
    notify: [['result'] ,(prev, current) => {
      //sendToNotify()
    }],
    beforeCompute: [(prev, current) => {
      //sendToNotify()
    }, ['compute']],
  },
}

// V2
function serverlessUnit () {
  const a = state()
  const b = useCache()
  const c = model('Entity')
  
  const d = computed(() => a().x + b().x)
  
  // must receive a parameter，有语义的合集
  // reducer的既视感
  const inputCompute = useInputCompute(async (parameter) => {
    // do something with draft：a,b,c
    
    // progress ? no 只有0，1的2种状态
    b.x = a.x + parameter    
  })
  
  // before compute
  useEffect([(prev) => {
    // prev = [a, b, c]
  }, [inputCompute]])

  // after compute
  useEffect([[inputCompute], (prev) => {
  }])
  
  return { a,b,c, compute }
}
```
