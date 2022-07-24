# 视图

在driver中可以自带视图组件，而不仅仅只输出数据+逻辑，

视图组件足够“大”的时候，也可以当作页面使用

就像使用组件库一样，直接使用配套的视图组件可以大幅降低接入成本


```javascript
// defination
export default function ViewComponent() {
  const driver = usedriver()
  return <view>{driver.data}</view>
}

// usage
function Main () {

  return <main><ViewComponent /></main>
}

```

不同于一般的组件库，driver的视图组件还需要考虑数据流情况，在使用组件要分成2种情况
- 组件内独立状态
- 全局状态

在多个地方使用了相同的视图组件，但内部状态会有差别

但好处时，由于在写driver时，已经提前区分了state和model，就可以做到state不同，而model相同，确保model数据在视图层的一致性

默认的处理策略是：视图组件在初始render时，state会重新初始化，而model也会重新获取并刷新到全局，其它相同的视图的model也会同步更新

参考"client data mode.md"，除了默认的方式，还视图里的数据还可以有其它的选择


## 页面 or 组件

这里的主要是区别在于页面是入口，页面需要手动render(Page) 才能mount到html里

1个view 包含 N个view，被引用的是组件，被mount的则是页面

当指定mount的时候需要声明一个mount dom容器

当mount 容器需要关心的是主要是client端的基本信息：

- Web
  - Head/Meta/Title
    - 头信息相关
  - Body
    - 容器样式信息header/footer
  - PWA
  - SSR/CSR
- 跨端
  - 其它如小程序/Android/iOS等


## 组件内driver

当引入一个driver里的view时，也同步引入了view内部使用的hook

有时候不仅仅是 import view就完事了，还需要关心到view内的状态情况

必要时甚至希望能watch内部事件，获取state，这需要view层的组件在运行时能够暴露一些通用的钩子

钩子有2类：

- view层
  - 侵入dom的修改
  - 问题：修改的时机能重要
    - mount前修改，那就得像axii一样，暴露vnode结构，如
    - mount后修改，较为简单，可以使用dom api，缺点是UI会多次重绘
- hook层
  - 读/写/监听
  - 问题：通过ref之类的通用api，暴露当前组件的hook result，这样就能监听state，调用inputCompute，需要结合connect一起做