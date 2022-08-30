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

## 自定义传输协议

这个问题应该是分成2个部分考虑：1.传输 2.协议

协议可以参考JSON，在JSON上拓展更多的复杂类型

JSON的缺陷是只能支持有限数据类型，这决定了在driver中不能存储复杂数据类型，如以下几类：
- DOM
- function
- 依赖prototype
- 二进制数据，如文件

同时在不同的环境中，不同的数据类型需要对应不同环境的数据，比如：
- 文件
  - client，Blob
  - node server，Buffer

这需要设计协议的在各个端的runtime，以及协议自身在传输中的中间状态

如果要做这件事，那就得设计一个通用协议格式，该协议要满足的抽象有：
- 自定义传输协议
  - 序列化
  - 发送
    - 环境
      - client
      - server
  - 接收
    - 环境
      - client
      - server
  - 传输方式
    - http（c/s之间）
    - tcp （s/s之间）

环境的交互目前仅限于2种情况： c -> s (同时也 s -> c), s1 -> s2

还没有 c1 -> c2 这种p2p的情况过于特殊，只有少量的应用场景，这里先不考虑

由于要用自定义协议，所以必定是要接管掉数据的发送，

因为在一体化driver的思想，需要识别不同的环境使用不同的发送客户端（这点可以基于axios来做，它本身已经实现了js的http发送能力）

s/s之间的传输需要在后面，这得基于动态compose的driver的设计才能实现，获得动态driver的ip/port/driver才能使用这个传输

所以目前只考虑 c/s，s与外部之间的http传输（如何解决 s与内网的非http传输？）

> 在传输中，在一个driver可能会引入仅支持nodejs的包用来在内网的传输，这得考虑在driver文件上编译时的切割，这应该是编译时要考虑的事情

### 传输

在传输的发起端，要能够正确的transform 协议，确保在各个端的正确运行。

但有个问题，在一体化的执行环境里，在描述逻辑会涉及到“类型系统”

那这个类型系统就需要同时考虑client File 或者 server Buffer，如果要在一个逻辑里区分他们就需要在逻辑里面做if判断

加入if判断就会说明执行环境的抽象泄露，导致了一体化彻底沦为了鸡肋

