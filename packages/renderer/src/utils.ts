import { VirtualLayoutJSON, JSONObjectTree, StyleRule } from './types'
import { deepClone }  from './lib/deepClone'
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

export interface JSONPatch {
  op: 'replace' // | 'add' | 'remove'
  path: string[]
  value: any
}

const ExportPropKey = 'props'

/**
 * key point: apply path to children array with same tag
 * patch[]{
 *   path: ['div', 'div', 'props', 'id'],
 * }
 */
export function applyJSONTreePatches (source: VirtualLayoutJSON, patches: JSONPatch[]) {
  const target = deepClone(source)

  for (const patch of patches) {
    const { op, path, value } = patch

    let current = [target]
    let i = 0
    for (; i < path.length - 1; i++) {
      const tag = path[i]
      if (tag === ExportPropKey) {
        break
      }
      const newCurrent: VirtualLayoutJSON[] = []
      for (const node of current) {
        if (isVirtualNode(node)) {
          if (node.tag === tag) {
            if (path[i + 1] === ExportPropKey) {
              newCurrent.push(node)
            } else if (Array.isArray(node.children)) {
              newCurrent.push(...node.children)
            }
          }
        }
      }
      current = newCurrent
    }
    const restKeys = path.slice(i)
    switch (op) {
      case 'replace':
        current.forEach(node => {
          set(node, restKeys, value)
        })
        break;
    }
  }

  return target
}

/**
 * 代理json并记录patch
 * 关键要点：因为有同名节点的存在，同一数组下的同名节点会被合并
 * 
 * 返回的是 Proxy对象，只需要考虑 Object，只收集 set
 */
export function proxyLayoutJSON (json: VirtualLayoutJSON) {
  const patches: JSONPatch[] = []

  const jsonTree = buildLayoutNestedObj(json)

  function createProxy (target: JSONObjectTree, pathArr: string[] = []) {
    const proxy = new Proxy(target, {
      get (target, key: string) {
        const v = Reflect.get(target, key)
        // console.log('target=', target, 'key=', key, 'value=',v);
        if (typeof v === 'object') {
          return createProxy(v, pathArr.concat(key))
        }
        return v
      },
      set (target, key:string, value: any) {
        const currentPathArr = pathArr.concat(key)
        patches.push({
          op: 'replace',
          path: currentPathArr,
          value
        })
        Reflect.set(target, key, value)
        return true
      }
    })
    return proxy
  }
  
  function applyPatches () {
    const newObj = applyJSONTreePatches(json, patches)
    return newObj
  }

  const draftJSON: JSONObjectTree = createProxy(jsonTree)

  return {
    patches,
    draft: draftJSON,
    apply: applyPatches
  }
}

/**
 * eg: 
 *  json: ['div', MyCpt, 'div']
 */
export function buildLayoutNestedObj(json: VirtualLayoutJSON) {
  let root: JSONObjectTree = {}

  function buildRoot(target: JSONObjectTree, source: VirtualLayoutJSON) {
    const tag = source.tag
    if (typeof tag === 'string') {
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
    } else {
      /**
       * @TODO support custom component
       */      
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
