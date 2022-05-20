# concepts

一个描述业务逻辑单元的组成成分，主要分成2个：实现的示例部分 和 runtime

业务层

- hooks/
  - main.js 主逻辑内容
- models/
  - er.json 描述ER的文件
- views/
  - UI.jsx
- include
  - otherUnits 应该是依赖分析，自动索引生成
    - (...recursion...)

基础层

- data.js 提供不同的hook方法
  - useState
  - useCache
  - useModel
  - useComputed
  - useInputCompute
  - watch
    - watchBefore
    - watchAfter
- runtime.js “单元”的执行器，内含执行时所需的上下文全局变量
  - CurrentHookStack
- connect
  - axii
  - react
  - vue
  - ...
- reactvity -> [@vue/reactivity](https://github.com/vuejs/core/tree/main/packages/reactivity)
- immer -> [immer](https://github.com/immerjs/immer)

服务层

- service.js
  - 描述：可以加载"单元"的启动入口， http -> service1 -> runtime -> "单元"
  - contentType: json, buffer, stream, image, file
- view.js
  - 描述：主要是服务SSR，加载组件,可选是否开启SSR  http -> service2 -> html tempate + render(page.jsx) -> html CSR or SSR
  - contentType: html，css，javascript
- application.js 上面拓展而来，主要是识别请求特征来转发
  - page -> loadAsPage
  - api -> loadAsService
