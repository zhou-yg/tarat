# 构建

开发体验是接近于next或remix这样的更整体的框架

所以需要考虑在dev和serve时，如何启动一个koa service

参考之前的脚手架，在dev端会插入一个webpack-dev-server

但有了esm之后，dev时期不需要重复build，这里有个启动点的问题

参考 [vite ssr](https://cn.vitejs.dev/guide/ssr.html)，  整体流程应该：

- koa service
  - load client dev server middleware
    - visitor http://page
      - response HTML
        - load javascript main file
          - load deps
            - match in client dev server middleware
              - response .Js


## 编译core

拆分为 core.server ，core.client

拆分的逻辑主要差别在Model层 和 inputCompute

因为无法在代码里里识别Model，所以会根据 build target，alias 2种不同的model，

默认使用的是可以直接计算和改数据的 core.server，client端通过alias指向到 core.client

这样就可以实现相同的BM代码在运行时的不同执行

- target
  - client
    - client model, post patches to server then wait
  - server
    - server model, receive patches and update DB then response result



# 打包

涉及2种形态的导出设计：BM 和 Application

Application include BM，额外多出的app/下的编译产物

统一基本原则：

为了确保在node端的执行，所有的编译产物统一使用commonjs格式

externals配置：知名库，tarat相关的，其余的也可以用户配置

如果包含多层文件夹结构的，都维持原本的文件夹结构（默认只读第一层结构

## code splitting

基于React.lazy和Rollup chunks，参考：https://ui.dev/react-router-code-splitting

## external

依赖的基础库：如react, react-router，core， antd应该是要external的，这些大库通常是稳定且遵守变更规范

但这些基础的“大”库又没法穷举，如何才能尽可能避免打包大库，大库不一定是体积最大，比如redux就很小

其次是npm上引用的一些小工具库，这些库很小，往往变更随意，为了导出单元的稳定性，小库应该被打包进来

思路方法是通过pkg.json的dependencies约定，让用户自己决定
- dependencies 会打包
- peerDependencies 不打包

dev和build的区别：
- dev 开发时本地肯定是有对应包的，所以可以全部external，
- build，需要对外发布了，采用上述的约定策略


## dev产物

dev产物由于借助vite，所以在client端的产物里就节省了很多编译工作

但在正式build中，需要编译出client产物，这部分应该是现对于dev的编译产物的额外拓展

统一的.tarat结构:

- hooks/ 编译后的hook，cjs格式，在node中使用
  - *.js 这里的js应该是完整的，已经包含了AST deps，不需要server运行时去手动读取下面的json
  - *.deps.json  这个依赖关系文件同时也会被用到了client中，在vite动态返回通过插件自动集成了
  - *.deps.js 同json
- views/ 单个view编译产物，核心库external
  - *.js 
  - *.css
- models/ 
  - schema.prisma  应该是整合了依赖BM的生成后的结果，同时也能解决自身工程里 schema.part问题
- app/
  - client/
    - routes.tsx 根据pages生成的router文件，标准esm，在vite中使用，作为client的渲染入口。通过插件集成 hook.deps.json      
  - server/
    - routes.server.js 编译后的SSR入口文件，cjs，node中使用
    - routes.server.css
    - router.entry.js 自定义的SSR入口的编译结构（optional)
    - router.entry.css

这样重新设计，build阶段就可以尽可能保持跟dev一样的结构

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

Application的编译产物组成，在dev产物的基础上进行增强：
- .tarat/
  - app/
    - client/ 增加原本vite不处理的编译结果
      - index.js 核心入口
      - index.css
      - chunks/ routes下面的各个子页面拆分为chunk
        - xxx.js
        - xxx.css
    - server/ 不变，可以继续沿用

server run start时需要依赖原本的工程信息：hooks结构，pages路由结构

### App编译产物

由于前面已经产出了 client/routes.tsx，这个文件就可以作为client的编译入口


## different module system

现在的确定性的模块系统有：
- tarat-server node运行端：必须是cjs
  - 说明：因为node esm没法删除import缓存，这个在tarat dev的时候是刚需，所以只能用cjs的require.cache来删除缓存
  - 衍生出的：
    - dist(或.tarat)/hooks/*.js 是 cjs
    - dist(或.tarat)/app/server/*.js 是cjs

因为其他模块的client会引用 dist(或.tarat)/hooks/*.js，而在client的开发过程，默认则是esm为主

这就导致了dist(或.tarat)/hooks/*.js 必须同时支持cjs和esm，冲突产生了

解决的方法是Unit在引用时，可以使用 dist(或.tarat)/hooks/esm/*.js

## dist view/page

在dev时，会先parse出hook的deps，然后通过vite插件的方式inject hook's deps

但是在build阶段时，没有这个插件，就会导致 view/page编译的产物没有deps

hook产物会自己再额外inject，所以没有这个问题

解决这个问题有2个思路：
- 编译 view/page，也通过插件inject hook's deps
- [√]在dev阶段就自动transform源码，使其实一个完整的文件，一劳永逸 
  - 一劳永逸的方法总是好的，而且在后续发展阶段里，也要考虑要交付的逻辑产物本应该就是要实时且完整，而不是依赖其它运行时进行补位

## independent hook

单一个Unit引用其他Unit的view或hook时，由于编译的关系，view的产物里会包含hook

在引用后

current unit hook -> unit's hook

current unit view -> unit's view（跟上面的 unit's hook 是2个module）

一劳永逸的解法：dist view不包含 hook代码，而是通过引用的方式来使用，确保只有一个module

由于runner的存在，所以即时是同一个module，在运行后依然是存在2个closure，内存不共享，

如果要共享内存，得考虑使用单例模式或Context，这里应该分情况，需要提供不同的数据模式，但前提必须先是只有一个module（sure？）
