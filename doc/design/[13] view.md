# 视图

在BM中可以自带视图组件，而不仅仅只输出数据+逻辑，

就像使用组件库一样，直接使用配套的视图组件可以大幅降低接入成本


```javascript
// defination
export default function ViewComponent() {
  const bm = useBM()
  return <view>{bm.data}</view>
}

// usage
function Main () {

  return <main><ViewComponent /></main>
}

```

不同于一般的组件库，BM的视图组件还需要考虑数据流情况，在使用组件要分成2种情况
- 组件内独立状态
- 全局状态

在多个地方使用了相同的视图组件，但内部状态会有差别

但好处时，由于在写BM时，已经提前区分了state和model，就可以做到state不同，而model相同，确保model数据在视图层的一致性

默认的处理策略是：视图组件在初始render时，state会重新初始化，而model也会重新获取并刷新到全局，其它相同的视图的model也会同步更新

## runtime

model的“全局”需要识别下runtime环境，在server端不需要这个处理，每个http request都应是pure context
