# serialization

参考qwik的方案，https://qwik.builder.io/docs/concepts/resumable#serialization

由于qwik要达到resumable的特性，所以需要在序列化的时候”记住“进度，便于在Client端恢复执行

但是在driver内，代码会同时在server/client 2端存在，所以不需要考虑”进度“只要同步”状态“即可，

而状态就是基本数据类型构成，所以用JSON即可，后续的优化可能也是朝着优化体积的方向进行，如：压缩字符串

```javascript
// 请求，每次都是全量传输 pacakges/core/scr/util.ts
interface IHookContext {
  initialArgList: any[]
  data: Array<
    ['data' | 'patch' | 'inputCompute' | 'model', any | IPatch[] | null]
  >
  index?: number
  args: any[]
  name: string
}
```

## 缺陷

JSON只能支持有限数据类型，这决定了在driver中不能存储复杂数据类型，如以下几类：
- DOM
- function
- 依赖prototype