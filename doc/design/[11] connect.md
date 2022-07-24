# connect

由于driver有自己的运行特性，跟现有框架里的hook的还是不太一致，需要一点胶水代码来抹平差异

## React

function component每次更新的时候都会重新运行，但driver不行，所以driver只能写在 useEffect里了

```javascript
function useConnectdriver () {
  const [result, setResult] = state({})
  useEffect(() => {
    runner(driverUnit)
      .onMount(r => setResult(r))
      .onUpdate(r => setResult(r))
  }, [])

  return { ...result }
}
```

## axii

axii是一次执行，这里考虑的是如何建立 driver数据到axii响应式数据的映射，

根据值的类型不同，2个映射规则：
- primtive
  - 映射为 atom(x)
- 非primtive
  - 映射为 reactive(x)