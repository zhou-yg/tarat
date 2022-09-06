const code = `
export default function uploader<T> () {
  // only in browser
  const inputFile = state<{ name: string }>()

  const OSSLink = computedInServer(() => a() + 1)

  const OSSLink = computedInServer(function * () {
    const file = inputFile()
    if (file) {
      return 'a'
    }
    return 'b'
  })
  const OSSLink2 = computedInServer(function * () {
    const file = inputFile()
    if (file) {
      return 'a'
    }
    return 'b'
  })

  const OSSLink3 = computedInServer<T extends object? (number) : (string) >
  (function * () {
    const file = inputFile()
    if (file) {
      return 'a'
    }
    return 'b' as any
  })
  

  return {
    inputFile,
    OSSLink
  }
}
`

