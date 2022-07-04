# compiler

现在整个框架涉及编译逻辑的处理有2处：1.core的分环境编译  2.server的ssr编译

未来加入一个杀手级编译：对BM的以 inputCompute的分功能模块编译

剩下的都是常规前端编译ts -> js


## core part

根据runtime的需要，需要区分运行环境，有2个方法区分

- 编译时拆分
  - 好处：编译时的好处是可以在产出物理直接做好隔离，减少代码量，提升性能
- 运行时判断
  - 好处：逻辑简单，而且SSR场景下可能够直接使用
  - 问题：client/server用一份产物，但会在内部做好环境判断，根据环境执行，会把server端逻辑暴露到client，不安全。

### 编译时

对于开发者可以不强感知到 client/server，但最终产物里必须小心区分，

对于逻辑单元本身，是不需要区分环境的，因为逻辑点可以视作是一种DSL，真正的区分环境是依赖runtime进行区分

- hooks/
  - hook.js
- app/pages/
  - home.jsx

通过构建工具的alias，实现在不同环境引用不同的core产物，实现分环境逻辑

```javascript
// 引入的是：core.server.js
import { model } from 'core'
function unit () {
  const b = model() // 内部实际逻辑是：直连db查询 
}

// 引入的是：core.client.js
import { model } from 'core'
function unit () {
  const b = model() // 内部实际逻辑是：在Model内实际是发RPC请求
}
```

## SSR的编译

主要是围绕page route tree 入口的编译

产出一个独立的ssr entry 纯js
