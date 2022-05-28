function cal<T> (a: T): ((v: T) => void) {
  return v => {
    return v
  }
}


function high<T> (aa: T) {

  const fn = cal<T>(aa)

  return fn
}

const hf = high(2)