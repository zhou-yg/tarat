# connect

由于BM有自己的运行特性，跟现有框架里的hook的还是不太一致，需要一点胶水代码来抹平差异

## React

function component每次更新的时候都会重新运行，但BM不行，所以BM只能写在 useEffect里了

```javascript
function useConnectBM () {
  const [result, setResult] = useState({})
  useEffect(() => {
    runner(BMUnit)
      .onMount(r => setResult(r))
      .onUpdate(r => setResult(r))
  }, [])

  return { ...result }
}
```