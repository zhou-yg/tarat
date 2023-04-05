# 问题记录

## 待修复tarat的问题

[] patchLayout 需要包裹整个children，类似于高阶组件，
[] patchLayout和patchRules 的 返回api还是有点迷糊，跟现在的DOM api对不齐，需要优化整理下 
[] h(Function)的模式下，缺少了Function的类型推导，需要加泛型
[x] vite hmr 有时是仅触发useEffect及回收函数，所以不能在回收函数里设置为null