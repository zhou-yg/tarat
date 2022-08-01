# 调用响应链
call stack/ reactive chain

使用声明式的方式进行描述，用基于依赖追踪模型来实现。

声明式范式的普遍性缺陷就在于运行时排查和调试，不同于指令式的可以断点，通过断点时的Context来排查

声明式范式由于的开发者只声明，其具体的运行过程由底层模型执行，也就造成了开发者无法深入debug了，体现在2个方面
- 无法主动设置数据并调用指令，定向trigger
- 无法获悉调用过程的执行栈（包含调用，触发）

由于computed的存在，会存在响应/调用的交替过程

显示依赖追踪的逻辑过程，便于排查问题

在这个过程应该关注的是：
- 触发源
  - driver mount
  - 外部调用（UI）
  - inputCompute
  - model.query
  - cache.query
- 调用/响应链
- 调试API
  - 或许可以参考deps的机制，通过assign机制注入劫持事件，提供各种时机

调用响应链中要关注的是
- 类型: call, trigger
- 对象: current -> children
  - 记录 hook的名称（或index），可以通过编译时加入名称
- 快照: old / new value

## 响应链

trigger一定是一个状态修改，这个调用可能会修改导致了状态的修改，从而导致了一系列连锁反应

现在的状态修改存在有：

- driver mount 过程中的，包含：
  - computed 重新执行，更新了自身
  - model 查询数据，更新了自身
  - cache 查询数据，更新了自身
- 外部调用setter修改

在调用发生，并修改了状态后，一引发后续的update

## 调用链

显示hook被调用的过程，类似call stack，分为内部和外部

- 初始化过程
  - computed 执行getter
  - model.query
- 外部发起
  - inputCompute调用

单独的state getter不会引起连锁反应，所以不需要考虑往下传递，只需要添加到当前chain即可

之所以要把上面的调用加进来，因为上面的调用往往伴随着状态的更新，也会引发连锁反应

## 合并

综合调用和响应就会发现这是互相伴随的过程，主要有2个大类：

- 初始化过程 (mount or update)
  - computed/model.query/cache 的内部调用，同时调用后可能会引起自身更新，导致触发连锁
    - computed/model/cache 的自身更新导致的连锁
- 调用发起
  - inputCompute 同时包含调用和修改后的响应
  - setter直接修改,修改后导致响应

所有的更新源自于调用，所以调用发起的地方，要额外判断是能否跟currentReactiveChain关联

在这些起点要做2个判断：
- 1.判断当前  
  - true：说明自己是连锁的下游，被其它调用了
  - false：
    - 2.再判断全局
      - true：说明是自己是起点
      - false：说明当前未开启调用链

能够currentReactiveChain关联的，说明是调用的起点

可作为起点的有：
- computed/model.query/cache.query
- inputCompute
- hook setter


初始化过程示例：
1.
> computed -> model/cache.get -> model/cache.query -> model/cache.update ->  ...
2.
> immediate model -> model.query -> 1.model.update -> ...
> immediate model -> model.query -> 2.computed -> ...
3.
> cache -> chace.query -> cache.update -> ...
调用发起
1.
> inputCompute -> applyComputes -> state.update -> ...
2.
> setter -> state.update -> ...