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


## 编译BM

拆分为 BM.server ，BM.client

拆分的逻辑主要差别在Model层，因为无法在代码里里识别Model，所以会根据 build target，alias 2种不同的model

- target
  - client
    - client model, post patches to server then wait
  - server
    - server model, receive patches and update DB then response result