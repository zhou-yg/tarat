# client数据模式

会涉及的一些场景：
- 全局的
  - 业务的全局统一数据：用户信息，登录信息
- 局部的
  - 以条件为索引：id下的某个列表

不同于server side的无状态特性，可以默认是每次运行的时候都重新初始化 with context

在UI framework里使用时，需要考虑有状态的问题

UI framework在使用driver时的诉求主要是2种：

- 不复用，每次都是新状态
  - 数据源为hook内的默认值
- 复用已经存在的相同driver的状态，（考虑driver的构造入参不同
  - Global 全局，且入参
    - 全局数据源为相同driver里在全局里的值
  - Context，使用当前链路里的状态
    - 数据源为相同driver里在链路里的值
  - 
   直接指定的
    - 数据源为指定的相同driver里的值

所以在使用driver的时候，需要提供1个复用开关：

- mode
  - global 全局模式
  - context 上下文模式
  - <designator> 已经声明为此key的driver

其他Unit可以通过复用View从而复用于driver，也要考虑在渲染View时，View内部的driver的数据模式

最后最重要的是，由于存在了多种可选的数据模式，一定会对开发者造成负担，这需要考虑通过提供一种默认模式，解决通用场景的问题

然后特定场景下再针对性的，按需求使用不同的数据模式

参考useSwr，只提供一种模式，再提供另外的手动模式（或参数）解决边界问题

可以将 use(driver)，视作一种api调用，区别在于用function，代替了useSwr的字符串key

按这个思路，可以以入参和function作为一个唯一索引key，可以直接使用swr的serialize函数