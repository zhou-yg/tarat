import { VirtualLayoutJSON, JSONObjectTree, StyleRule } from './types'

function assignRules (json: VirtualLayoutJSON, rules: StyleRule[]) {

}

function assignPattern () {

}

export function isVirtualNode(node: any): node is VirtualLayoutJSON {
  return (
    node &&
    typeof node === 'object' &&
    'tag' in node &&
    'props' in node &&
    'children' in node
  )
}

export function proxyLayoutJSON(json: VirtualLayoutJSON) {
  let root: JSONObjectTree = {}

  function buildRoot(target: JSONObjectTree, source: VirtualLayoutJSON) {
    if (typeof source.tag === 'string') {
      const tag = source.tag
      /**
       * @TODO how to keep reference to original "props object"?
       */
      target[tag] = <JSONObjectTree>{
        props: source.props
      }
      if (Array.isArray(source.children) || isVirtualNode(source.children)) {
        ;[].concat(source.children).forEach(child => {
          buildRoot(target[tag], child)
        })
      }
    }
  }

  buildRoot(root, json)

  return root
}

export function traverse(
  obj: any,
  callback: (k: string[], v: any) => boolean | void,
  path: string[] = []
) {
  if (!obj || typeof obj !== 'object') return
  for (let k in obj) {
    const v = obj[k]
    if (callback(path.concat(k), v)) {
      traverse(v, callback, path.concat(k))
    }
  }
}

export function traverseLayoutTree(
  layoutTree: VirtualLayoutJSON,
  callback: (n: VirtualLayoutJSON) => void
) {
  traverse(layoutTree, (k, v) => {
    if (
      typeof v === 'object' &&
      Reflect.has(v, 'tag') &&
      Reflect.has(v, 'props') &&
      Reflect.has(v, 'children')
    ) {
      callback(v)
    }
  })
}

/** fork from swr */
export const noop = () => {}

export const UNDEFINED = /*#__NOINLINE__*/ noop() as undefined

export const OBJECT = Object

export const isUndefined = (v: any): v is undefined => v === UNDEFINED
export const isFunction = <
  T extends (...args: any[]) => any = (...args: any[]) => any
>(
  v: unknown
): v is T => typeof v == 'function'

const table = new WeakMap<object, number | string>()

// counter of the key
let counter = 0

export const stableHash = (arg: any): string => {
  const type = typeof arg
  const constructor = arg && arg.constructor
  const isDate = constructor == Date

  let result: any
  let index: any

  if (OBJECT(arg) === arg && !isDate && constructor != RegExp) {
    // Object/function, not null/date/regexp. Use WeakMap to store the id first.
    // If it's already hashed, directly return the result.
    result = table.get(arg)
    if (result) return result

    // Store the hash first for circular reference detection before entering the
    // recursive `stableHash` calls.
    // For other objects like set and map, we use this id directly as the hash.
    result = ++counter + '~'
    table.set(arg, result)

    if (constructor == Array) {
      // Array.
      result = '@'
      for (index = 0; index < arg.length; index++) {
        result += stableHash(arg[index]) + ','
      }
      table.set(arg, result)
    }
    if (constructor == OBJECT) {
      // Object, sort keys.
      result = '#'
      const keys = OBJECT.keys(arg).sort()
      while (!isUndefined((index = keys.pop() as string))) {
        if (!isUndefined(arg[index])) {
          result += index + ':' + stableHash(arg[index]) + ','
        }
      }
      table.set(arg, result)
    }
  } else {
    result = isDate
      ? arg.toJSON()
      : type == 'symbol'
      ? arg.toString()
      : type == 'string'
      ? JSON.stringify(arg)
      : '' + arg
  }

  return result
}

export const serialize = (key: any): [string, any] => {
  if (isFunction(key)) {
    try {
      key = key()
    } catch (err) {
      // dependencies not ready
      key = ''
    }
  }

  // Use the original key as the argument of fetcher. This can be a string or an
  // array of values.
  const args = key

  // If key is not falsy, or not an empty array, hash it.
  key =
    typeof key == 'string'
      ? key
      : (Array.isArray(key) ? key.length : key)
      ? stableHash(key)
      : ''

  return [key, args]
}

export const unstable_serialize = (key: Object) => serialize(key)[0]

export const isArray = Array.isArray

export function last<T>(arr: T[]): T {
  return arr[arr.length - 1]
}

export function set(obj: any, path: string | (number | string)[], value: any) {
  let base = obj
  const currentFieldPath = isArray(path)
    ? path.slice(0)
    : path.split
    ? path.split('.')
    : [path]
  if (currentFieldPath.length > 0) {
    const fieldName = currentFieldPath.pop()
    currentFieldPath.forEach((p, i) => {
      if (base[p] === undefined) base[p] = {}
      base = base[p]
    })
    if (base instanceof Map) {
      base.set(fieldName, value)
    } else if (base instanceof Set) {
      base.add(value)
    } else {
      base[fieldName!] = value
    }
  }
}

export function get(obj: any, path: string | (number | string)[]) {
  let base = obj
  const pathArr = isArray(path)
    ? path.slice(0)
    : path.split
    ? path.split('.')
    : [path]
  if (pathArr.length === 0) {
    return obj
  }
  const currentPathArr = pathArr.slice(0, -1)
  const key = last(pathArr)
  for (const p of currentPathArr) {
    if (base[p] === undefined) return undefined
    base = base[p]
  }
  if (base instanceof Map) {
    return base.get(key)
  }
  return base[key]
}
