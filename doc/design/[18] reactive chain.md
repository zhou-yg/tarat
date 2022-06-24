# 调用/响应 链

显示逻辑过程，便于打印 和 排查

## 响应链

发起者一定是一个状态修改，这个调用可能会修改导致了状态的修改，从而导致了一系列连锁反应

现在的状态修改存在有：

- hook初始化自执行的修改，包含：
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