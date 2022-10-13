# 发版策略

参考 [next.js](https://github.com/vercel/next.js/tree/canary/packages/next)

对比remix有多个库，这种单一库有一些优点：
- 一次安装，一次更新
- 可以通过ts类型提示相关模块，而不用去官网查找

tarat的策略是将多个monorepo 合并为单一库发布，但需要解决的是依赖的问题

- server -> connect & core
- connect -> core

现在是通过复制代码 + 修改依赖路径，这样可以自动同步各个包的产物路径

但不好的是需要手动维护依赖路径，后期容易出问题

另一个方法，在单一库 tarat中手动写入口文件，然后进行针对性的编译，相比现状重复工作较多，但后期容易维护，后续再加上