# client数据模式

不同于server side的无状态特性，可以默认是每次运行的时候都重新初始化 with context

在UI framework里使用时，需要考虑有状态的问题

UI framework在使用driver时的诉求主要是2种：

- 不复用，每次都是新状态
  - 数据源为hook内的默认值
- 复用已经存在的相同driver的状态
  - Global 全局
    - 全局数据源为相同driver里在全局里的值
  - Context，使用当前链路里的状态
    - 数据源为相同driver里在链路里的值
  - Designator 直接指定的
    - 数据源为指定的相同driver里的值

所以在使用driver的时候，需要提供1个复用开关：

- mode
  - global 全局模式
  - context 上下文模式
  - <designator> 已经声明为此key的driver

其他Unit可以通过复用View从而复用于driver，也要考虑在渲染View时，View内部的driver的数据模式

最后最重要的是，由于存在了多种可选的数据模式，一定会对开发者造成负担，这需要考虑通过提供一种默认模式，解决通用场景的问题

然后特定场景下再针对性的，按需求使用不同的数据模式

参考useSwr，是否有机会只提供一种模式，再提供另外的手动模式解决边界问题

比如问题是：同样的global，但参数不同，是否强行global，会不会因为经常的参数，导致global模式只能用于无参数的driver

示例中的是通过参数的方式来指定，但在实际中，由于driver可能自带参数，所以这样的代码写起了会很丑陋，而且会跟driver的参数有问题

```javascript
function Component () {
  const hook = useDriver(driver, 1, 2, {
    mode: 'global'
  })
}

<DriverContext mode="global">
  <ViewWithAnyDriver />
</DriverContext>
```

## 声明

数据源的问题，如何决定哪个在运行的driver成为数据源，

首先想到的2个思路：

- 隐式，比如默认约定第一个运行的driver成为全局数据源
  - 问题：比较模糊，不容易清楚到底哪个driver先执行，而且某些情况无法手动指定为全局
- 显示，在useDriver需要指定这个driver可以成为全局数据

因为driver可以被指定，所以要区分在显示声明为可复用时，可以用同一个key区分 global/designator 和 context

一旦声明了mode，那就意味这当前driver跟其它driver一致了，不区分谁是provider，谁是consumer，如同单例模式

即如果全局或Context里不存在这个designator则新建，存在则复用数据

```javascript
function Component () {
  const hook = useDriver(driver, {
    mode: 'global'
  })
}
```

当mode=global 或 <designator>时, 可以用一套逻辑实现，都放到全局里，相对简单

当mode=context，需要通过提供类似 Context.Provider的wrap function进行隔离

## Context隔离

key的思路是类似指针，建立的是跟"地址"的引用关系，然后通过“相同字符串这个共性”才间接的建立起内存上的引用关系。

> driver -> key -> global -> key -> driver2 

实现思路是在不用全局key的情况下，如何找到到数据源。那就必须建立直接内存上的引用关系

在不显示声明如字符串key或其它的情况下，那就是只剩下一种默认的约定方式。

即当是context的时候，执行逻辑是要固定判断此时全局里必定有一个钩子，代表了已经存在的driver

如果hook是在UI framework里使用 则这个钩子的生命周期逻辑必须跟UI framework里使用hook的逻辑一致

才能有能确保在钩子的值的有效

所以在hook要消费的是UI framework层面的Context，那实现方式就得依赖于UI framework的Context方法

根据hook的使用场景，实现方式：

- 不在，
  - 检测钩子，存在则返回当前Runner实例，同单例模式
- 在UI framework里使用
  - 提供结合了UI framework的Context api 实现


```javascript
function Component () {
  const hook = useDriver(driver)

  return <hook.Provider><Component2 /></hook.Provider>
}
function Component2 () {
  // 不需要显示的声明了，mode=context时，检查全局钩子的情况即可
  const hook = useDriver(driver, {
    mode: 'context'
  })

  return <div></div>
}
```

## 针对driver嵌套

driver之间被设计成可以以函数调用的方式嵌套使用，此时它们共享一个scope

另外一个问题是，在嵌套的时没有useDriver的设置入口，无法通过useDriver设置mode

```javascript 
function driver1 () {
  const result2 = driver2()
}
```

driver1和driver2产生了针对复用问题冲突的问题，解决思路是：

- 共享相同的复用规则
  - driver1和driver2不视作一个整体，不能像现在这样使用，需要将它们的scope隔离开发
  - 效果：
    - driver1的独立性更强了，driver的单元性更完整
    - 在global的情况下，driver1除了会被相同的driver1影响，还会被全局的driver2影响，这是双刃剑
      - 好处：全局状态下，数据确实更同步了
      - 不坏：driver1在依赖链路较深的情况下，输入的影响非常不可知
- 只看driver1，无视driver2
  - 完全视作一个整体，简单粗暴，但无法单独解决driver2的global问题
- 在嵌套时指定规则
  - 也许更灵活，对于使用者而言内部是一个大黑盒，而且存在多种的数据复用情况，不可控

从上层的driver角度来看，不管什么方案都无法完美适应所有情况

也许问题不应该有这么复杂，从driver的角度来看是不是要复用往往出于性能和体验考虑，应该回到底层

看看数据，重点思考state和model的数据复用特性

- model，那就一定是global的，但query条件可能存在不同
- state 可以是global 或 context
- 未来的cache，也一定是global的

不同类型的数据层面容易确定清楚，上层的driver单元就可以用最简单的实现来做