# signal

在经历一系列实践之后，发现core内部的代码还可以再分层：
- 纯·状态驱动 -> signal
  - js runtime
- 有远端数据的数据 -> core = signal + 拓展
  - Node
  - 前后一体化环境

这2层均需要加入核心features的支持：
- 依赖解析
- 类型解析 
- M2V

## signal

核心组成：
- State & AsyncState 基类
  - 基类的hookFactory
- Computed & InputCompute
- Runner & Scope
- 注册机制

核心的成分里应该不涉及 Context传输的，Cotext传输可以拆分成一个 get 和 set，中间的部分不管了交由外部实现

## core

核心组成：
- Model拓展类
  - 拓展类的hookFactory
- XXXInServer系列
- 自带 Context 传输的处理
- 写入新拓展的类


