# SSR

这有点超出feature范围，在描述业务逻辑的时候不关心是不是ssr

由于as service 返回的都是JSON，服务于业务逻辑

SSR的场景下返回的是HTML，服务于是View 渲染

所以SSR不会是在业务模型内处理的，额外另起服务加载，流程是：

> request -> SSR Service -> View & ServerlessUnit -> renderToHTMLString

对应业务模型来说，为了尽可能提供性能，最好是在SSR里已经处理好的internalState也一并”记住“，

不需要再在Client端replay，达到resumable的特性

所以这里的重点是如何”记住“ ，思考的路径是在SSR的过程里如何将internalState序列化到SSR的结果里，2个地方：

- script tag里的js对象
- html结构中
