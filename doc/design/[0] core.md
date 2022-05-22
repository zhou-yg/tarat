# 世界观

> 名字？

基于响应式的，纯粹的，描述的业务逻辑执行模型（不限语言，环境），write once run any where

简称：BM

> 参考： remix, solid-js,qwik，nextjs，dva，redux，react hooks，axii，vue setup，Proxy, event sourcing, immer

- 内部状态是响应式，状态，计算的叉乘组合
- 模型是一个计算整体，只有外界输入才能改变内部状态
- 计算和内部状态会产生的副作用，但不能返过来



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
