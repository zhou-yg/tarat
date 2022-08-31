function traverse (
  target: Record<string, any>,
  callback: (arrPath: string[], value: any) => void,
  parentKeys?: string[]
) {
  if (!parentKeys) {
    parentKeys = []
  }
  Object.entries(target).forEach(([key, value]) => {
    const currentKeys = parentKeys.concat(key)
    callback(
      currentKeys,
      value
    )
    if (typeof value === 'object' && value) {
      traverse(value, callback, currentKeys)
    }
  })
}

traverse({
  a:1,
  b:2,
  c: {
    zz: 33,
    d: new FormData()
  },
}, (k, v) => {
  console.log('k, v: ', k, v);
})