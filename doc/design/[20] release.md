# release

涉及2种形态的导出设计：BM 和 Application

Application include BM，额外多出的app/下的编译产物

统一基本原则：

为了确保在node端的执行，所有的编译产物统一使用commonjs格式

externals配置：知名库，tarat相关的，其余的也可以用户配置

如果包含多层文件夹结构的，都维持原本的文件夹结构

## BM

BM的基本组成：
- views
  - 源文件：包含 jsx 和 css文件，有文件树，互相之间可以互相引用
  - 导出：
    - jsx -> js
    - less -> css
- hooks
  - 源文件：应该是纯js,ts文件
  - 导出：
    - js,ts -> js (cjs格式)，并集成 AST deps
- models
  - *.prisma 原结构导出，不需要编译

在Tarat内使用自己的BM的编译产物时，理应不需要再二次处理了，如同 AST deps也自动集成了


## Application

Application的编译产物主要是用于run start的生产模式执行

理论上来说一个目标是Application的产品不会产生有复用价值的view or hook，因为里面都是胶水代码

但考虑到实际可能会有设计得很好的，兼具Application和BM的工程，那它的BM编译产物依然有复用的价值

Application的由于侧重的是run start的生产执行，所以重点是考虑以下几个方面：
- 完整性
- 性能
- SSR/SSG
- chunk
- 执行环境区分client/server

反观参考remix的编译产物：它的serve build和dev一样，都是只有一个buildPath就搞定了，因为remix是完全的一体化 UI/loader/action，确实可以一个文件搞定

client/server UI产物的区别：
- 相同：都基于一套路由规则，都需要编译成js
  - 注：dev模式下，client不需要额外编译，vite可以帮助（这里dev和production使用2套机制，危？）
- 不同：
  - server：外部使用StaticRouter，指定location，剩下的执行函数返回HTMLString
  - client：外部使用BrowserRouter，需要注入tarat adaptor，并执行 ReactDOM.render渲染，不需要返回值，不需要指定location

Application的编译产物组成：
- client/
  - index.js 核心入口
  - index.css
  - chunks/ routes下面的各个子页面拆分为chunk
    - xxx.js 
    - xxx.css
- server/
  - index.js
  - hooks/
    - a.js 内含了 AST deps