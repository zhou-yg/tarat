# compiler

根据runtime的需要，需要区分运行环境，有2个方法区分

- 编译时拆分
- 运行时判断


## 编译时

对于开发者可以不强感知到 client/server，但最终产物里必须小心区分，

对于同一个逻辑单元，通过编译手段最终生成2分js

- server/
  - hook.server.js
  - loadAsService.js
- client/
  - pages/
    - home.jsx
    - hook.client.js

编译时的好处是可以在产出物理直接做好隔离，减少代码量，提升性能

```javascript
// hook.server.js
function unit () {
  const b = useServerModel() // 直连db查询 
}

// hook.client.js
function unit () {
  const b = useClientModel() // 在Model内实际是发RPC请求
}
```

但需要考虑个问题：SSR场景里，虽然hook.client.js是针对client的产物，但同样需要包含server逻辑，否则就无法SSR了

其中一个办法是：单独编译一个SSR的产物，除了业务逻辑模型是用了 hook.server.js 其它跟client的产物相同

所以围绕业务逻辑模型的相关产物就有3种

- hook.client + view.jsx (for CSR)
- hook.server + view.jsx (for SSR)
- hook.server as service (for api)

最终结构：

- server/
  - hook.server.js
  - loadAsService.js
  - ssr/  新增的
    - home.ssr.jsx
    - hook.server.js
- client/
  - pages/
    - home.jsx
    - hook.client.js

## 运行时

client/server用一份产物，但会在内部做好环境判断，根据环境执行，会把server端逻辑暴露到client，不安全

好处是逻辑简单，而且SSR场景下可能够直接使用