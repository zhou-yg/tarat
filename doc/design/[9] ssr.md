# SSR

在当前的抽象设计里，SSR变成必须要实现，而不是optional

因为当view视作为业务逻辑网络的viewport，在没有完全准确的AST分析之前，

唯一能依靠的就是view运行时的产生getter行为，从而得出逻辑网络的哪些状态被view所依赖了，产生了类似于”订阅“的关系

> 后续可以保存这些”订阅“关系，从而可视化的展示Model和逻辑网络的层次

## serliazation

对应driver来说，为了尽可能提供性能，最好是在SSR里已经处理好的internalState也一并”记住“，

不需要再在Client端replay，达到resumable的特性

所以这里的重点是如何”记住“ ，思考的路径是在SSR的过程里如何将internalState序列化到SSR的结果里，2个地方：

- 模板的script tag里的js对象 √
- html结构中（  qwik.js ？ ）

## compiler

为了要在node环境能够renderToString出html字符串，那就必须要对routes中的(j|t)sx进行编译，确保产物是纯js代码

compiler入口：
- app/routes/
  - 具体页面
- app/server.entry.ts
  - server render端入口，可以用来处理B/S DOM/BOM兼容，设定SSR过程中的全局变量，提供顶级Provider

compiler产物：
- 纯js，可在当前node环境中执行，包含routes下的所有页面

compiler使用：
- 返回渲染入口函数
  - 根据入参：url.pathname，url.searchParams

## 路由的组合

参考最新的 [react-router](https://reactrouter.com/docs/en/v6/components/outlet)

根据 pathname 找到匹配的 route pathes，然后用react-router提供的api进行组合

将组合的结果set 到 entry.server 然后渲染

```javascript
// pathname: /a/b
function SSRAPP () {
  return (
    <RouteContext.Provider value={{
      outlet: (
        <RouteContext.Provider value={{ outlet: /* any children outlet of B */ }}>
          <B />
        </RouteContext.Provider>
      )
    }}>
      <A />
    </RouteContext.Provider>
  )
}
/**
 * 或者直接构建完整Routes，通过pathname指定，但这种方式相当于解析之后组合再运行解析，有点重复，在这个场景下有点重复
 * 在需要手动声明routes的project可以这么使用，可以使用已经声明好的结果，更方便
 */
function SSRAPP2 () {
  return (
    <Routes location={{ pathname: '/a/b' }}>
      <Route path="/a" element={A} >
        <Route path="b" element={B} >
      </Route>
    </Routes>
  )
}
```

## DOM/BOM模拟

非必须不直接使用 DOM/BOM Api，最佳实践是通过各种hook进行代理操作，

就像remix提供的各种默认 components

这样在node环境下执行的时候，直接在代理中检测运行环境并拦截即可