import {
  VirtualLayoutJSON,
  LayoutTreeProxyDraft,
  StyleRule,
  PatternStructure,
  BaseDataType,
  OverrideModule,
  StateManagementMatch,
  PatternStructureResult,
  LayoutTreeDraft
} from './types'
import { deepClone } from './lib/deepClone'
import { css } from '@emotion/css'
import { CommandOP, LayoutStructTree, PatchCommand } from './types-layout'

export function mergeOverrideModules(modules: OverrideModule[]) {
  const result: OverrideModule = {}
  for (const module of modules) {
    if (module) {
      for (const key in module) {
        if (result[key]) {
          result[key] = [].concat(result[key]).concat(module[key])
        } else {
          result[key] = module[key]
        }
      }
    }
  }

  Object.entries(result).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // compose function array
      result[key] = value.reduceRight((prev, cur) => {
        return (...args: any[]) => {
          cur(...args)
          prev(...args)
        }
      })
    }
  })

  return result
}

export function mergeClassNameFromProps(
  json: VirtualLayoutJSON,
  props: Record<string, any>
) {
  const { className } = props
  if (className) {
    if (json.props.className) {
      json.props.className = `${json.props.className} ${className}`
    } else {
      json.props.className = className
    }
  }
  return json
}

export function assignRules(draft: LayoutTreeProxyDraft, rules: StyleRule[]) {
  for (const rule of rules) {
    const { condition, target: draftTarget, style } = rule
    if (!!condition || condition === undefined) {
      const pathInDraft: string[] = getPathsFromDraft(draftTarget)
      const stylePath = pathInDraft.concat(['props', 'style'])

      const styleObj = get(draft, stylePath)
      if (isFake(styleObj)) {
        set(draft, stylePath, {})
      }
      Object.entries(style).forEach(([k, v]) => {
        set(draft, stylePath.concat(k), v)
      })
    }
  }
}
/**
 * key point: pattern implicitly match every JSON Node
 */
export const SEMATIC_RELATION_IS = 'is'
export const SEMATIC_RELATION_HAS = 'has'
function checkSematic(sematic: string, props: VirtualLayoutJSON['props']) {
  let result = false
  const kvArr = Object.entries(props)
  for (const [k, v] of kvArr) {
    const [relationField, ...sematicArr] = k.split('-')
    if (relationField === SEMATIC_RELATION_IS && sematicArr.length > 1) {
      throw new Error(
        '[checkSematic] the node can not be multiply sematic at the same time'
      )
    }
    if ([SEMATIC_RELATION_IS, SEMATIC_RELATION_HAS].includes(relationField)) {
      result = result || sematicArr.includes(sematic)
    }
    if (result) {
      break
    }
  }
  return result
}

function selectorHasPseudoClass(selector: string) {
  return selector.includes(':')
}

function camelToLine(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function patternResultToEmotionCSS(
  style: PatternStructureResult,
  pseudo?: string
) {
  let styleRows: string[] = []
  Object.entries(style || {}).forEach(([k, v]) => {
    const r = Array.isArray(v) ? last(v) : v
    styleRows.push(`${camelToLine(k)}: ${r};`)
  })

  return css`
    ${styleRows.join('\n')}
  `
}

export function assignPattern(
  json: VirtualLayoutJSON,
  pattern: PatternStructure,
  useEmotion?: boolean
): VirtualLayoutJSON {
  // const source = deepClone(json)
  const source = json

  traverseLayoutTree(source, node => {
    const { props } = node
    for (const sematic in pattern) {
      if (checkSematic(sematic, props)) {
        const style = pattern[sematic]
        if (useEmotion) {
          const cls = patternResultToEmotionCSS(style)
          if (props.className) {
            props.className = `${props.className} ${cls}`
          } else {
            props.className = cls
          }
        } else {
          if (!props.style) {
            props.style = {}
          }
          Object.entries(style).forEach(([k, v]) => {
            props.style[k] = Array.isArray(v) ? last(v) : v
          })
        }
      }
    }
  })
  return source
}
type PatternStructureValueMatcher =
  | (number | string | boolean)[]
  | (number | string | boolean)[][]

type MatcherValueOrStar<T extends PatternStructureValueMatcher> = {
  [K in keyof T]: T[K] | '*'
}

interface PatternMatrix {
  [mainSematic: string]: {
    [propertyKey: string]: {
      [value: string]: PatternStructureValueMatcher
    }
  }
}

function equalMatcher(setting: any[] | any[][], inputs: any[]) {
  return (
    setting.every((v, i) => v === inputs[i] || v === '*') ||
    setting.some(arr2 => {
      if (Array.isArray(arr2)) {
        return equalMatcher(arr2, inputs)
      }
      return false
    })
  )
}

export function matchPatternMatrix<T extends PatternStructureValueMatcher>(
  patternInputs: T
) {
  return (ps: PatternMatrix) => {
    let result: PatternStructure = {}
    for (let mainSemantic in ps) {
      result[mainSemantic] = {}
      for (let propertyKey in ps[mainSemantic]) {
        result[mainSemantic][propertyKey] = []
        for (let value in ps[mainSemantic][propertyKey]) {
          const matcher = ps[mainSemantic][propertyKey][value]

          if (equalMatcher(matcher, patternInputs) || matcher.length === 0) {
            result[mainSemantic][propertyKey].push(value)
          }
        }
      }
    }
    return result
  }
}
// in html attributes
export const renderHTMLProp = '_html'

export const VirtualNodeTypeSymbol = Symbol.for('polymitaVirtualNodeSymbol')

export function isVirtualNode(node: any): node is VirtualLayoutJSON {
  return (
    node &&
    typeof node === 'object' &&
    'type' in node &&
    'props' in node &&
    'children' in node &&
    node.flags === VirtualNodeTypeSymbol
  )
}

export interface DraftPatch {
  op: DraftOperatesEnum.insert | DraftOperatesEnum.replace | DraftOperatesEnum.remove // | 'add' | 'remove'
  path: string[]
  value: any
}

const ExportPropKey = 'props'

export function getChildrenByPath(
  source: VirtualLayoutJSON,
  path: (string | number)[]
): [VirtualLayoutJSON[], number] {
  let current = [source]
  let i = 0
  for (; i < path.length - 1; i++) {
    const tag = path[i]
    if (tag === ExportPropKey) {
      break
    }
    const newCurrent: VirtualLayoutJSON[] = []
    for (const node of current) {
      if (isVirtualNode(node)) {
        if (node.type === tag) {
          if (path[i + 1] === ExportPropKey) {
            newCurrent.push(node)
          } else if (Array.isArray(node.children)) {
            newCurrent.push(...node.children.filter(isVirtualNode))
          }
        }
      }
    }
    current = newCurrent
  }
  const lastPath = path[i]
  current = current.filter(n => n.type === lastPath)
  return [current, i]
}

/**
 * key point: apply path to children array with same tag
 * patch[]{
 *   path: ['div', 'div', 'props', 'id'],
 * }
 */

export enum DraftOperatesEnum {
  insert = 'insert',
  remove = 'remove',
  replace = 'replace',
}

const DRAFT_OPERATES = [
  DraftOperatesEnum.insert,
  DraftOperatesEnum.remove,
  DraftOperatesEnum.replace
]

export function applyJSONTreePatches(
  source: VirtualLayoutJSON,
  patches: DraftPatch[]
) {
  const target: VirtualLayoutJSON = (source)

  for (const patch of patches) {
    const { op, path, value } = patch
    let [current, i] = getChildrenByPath(target, path)
    switch (op) {
      case DraftOperatesEnum.replace:
        const restKeys = path.slice(i)
        current.forEach(node => {
          set(node, restKeys, value)
        })
        break
      case DraftOperatesEnum.insert:
        current.forEach(node => {
          if (node.children) {
            node.children = [].concat(node.children).concat(value)
          } else {
            node.children = [value]
          }
        })
        break
      case DraftOperatesEnum.remove:
        break
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
export const handlerPathKeySymbol = Symbol.for('handlerPathKeySymbol')
export type ProxyLayoutHandler = ReturnType<typeof proxyLayoutJSON>

function getPathsFromDraft (target: any): string[] {
  return target[handlerPathKeySymbol]
}

const draftOperationMethodSymbol = Symbol.for('draftOperationMethod')

const fakeProxyObjectSymbol = Symbol.for('fakeProxyObjectSymbol')

function isFake (obj: any) {
  return obj && obj[fakeProxyObjectSymbol]
}

export function proxyLayoutJSON(json: VirtualLayoutJSON) {
  const patches: DraftPatch[] = []

  const jsonTree = buildLayoutNestedObj(json)

  function createProxy(target: LayoutTreeDraft, pathArr: string[] = []) {
    const proxy = new Proxy(target, {
      get(target, key: string | symbol | DraftOperatesEnum) {
        if (key === handlerPathKeySymbol) {
          return pathArr
        }
        const v = Reflect.get(target, key)
        // console.log('target=', target, 'key=', key, 'value=',v);
        if (typeof key === 'string') {
          if (DRAFT_OPERATES.includes(key as DraftOperatesEnum)) {
            return createProxy(Object.assign(() => {}, { [draftOperationMethodSymbol]: key }), pathArr)
          } else {
            return createProxy(v || { [fakeProxyObjectSymbol]: true }, pathArr.concat(key))
          }
        }
        return v
      },
      set(target, key: string, value: any) {
        const currentPathArr = pathArr.concat(key)
        patches.push({
          op: DraftOperatesEnum.replace,
          path: currentPathArr,
          value
        })
        Reflect.set(target, key, value)
        return true
      },
      apply(target: any, thisArg, argArray) {
        // console.log('target: ', target[draftOperationMethodSymbol]);
        const currentPathArr = pathArr
        const op: DraftOperatesEnum = target[draftOperationMethodSymbol]
        switch (op) {
          case DraftOperatesEnum.insert:
            patches.push({
              op,
              path: currentPathArr,
              value: argArray[0]
            })
            break
          case DraftOperatesEnum.remove:
            patches.push({
              op,
              path: currentPathArr,
              value: argArray[0]
            })
          case DraftOperatesEnum.replace:
            patches.push({
              op,
              path: currentPathArr,
              value: argArray[0]
            })
        }
      }
    })
    return proxy
  }

  function commit () {
    
  }

  function applyPatches() {
    const newObj = applyJSONTreePatches(json, patches)
    return newObj
  }

  // 此处的类型应该根据 layout 结构生成得出，但这里是通用方法，无法精确取得类型
  const draftJSON = createProxy(jsonTree)

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
export function buildLayoutNestedObj<T extends LayoutStructTree>(json: VirtualLayoutJSON): LayoutTreeDraft {
  let root: LayoutTreeDraft = {}

  function buildRoot(
    target: LayoutTreeDraft,
    source: VirtualLayoutJSON | BaseDataType
  ) {
    if (isVirtualNode(source)) {
      const tag = source?.type
      if (typeof tag === 'string') {
        /**
         * @TODO how to keep reference to original "props object"?
         */
        target[tag] = <LayoutTreeDraft>{
          [ExportPropKey]: source.props
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
  }

  buildRoot(root, json)

  return root
}

let max = 1e3
export function traverse(
  obj: any,
  callback: (k: string[], v: any) => boolean | void,
  path: string[] = [],
  cache: Set<any> = new Set()
) {
  if (cache.has(obj)) {
    return
  }
  cache.add(obj)
  if (callback(path, obj) !== false) {
    if (!obj || typeof obj !== 'object') return
    for (let k in obj) {
      const v = obj[k]
      if (callback(path.concat(k), v) !== false) {
        traverse(v, callback, path.concat(k), cache)
      }
    }
  }
}

export function traverseLayoutTree(
  layoutTree: VirtualLayoutJSON | any,
  callback: (n: VirtualLayoutJSON) => void
) {
  if (isVirtualNode(layoutTree)) {
    callback(layoutTree)

    if (layoutTree.children) {
      if (Array.isArray(layoutTree.children)) {
        layoutTree.children.forEach(child => {
          traverseLayoutTree(child, callback)
        })
      } else {
        traverseLayoutTree(layoutTree.children, callback)
      }
    }
  }
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
export const VNodeComponentSymbol = Symbol('VNodeComponentSymbol')
export function isVNodeComponent(target: any) {
  return target && !!target[VNodeComponentSymbol]
}


function createVirtualNode (child: PatchCommand['child']) {
  return {
    id: -1,
    flags: VirtualNodeTypeSymbol,
    type: child.type,
    props: {},
    children: child.value
  }
}

function doPatchLayoutCommand(cmd: PatchCommand, draft: LayoutTreeProxyDraft) {
  let parent = draft;

  const paths = getPathsFromDraft(cmd.parent)
  
  paths.forEach(path => parent = parent[path])

  switch (cmd.op) {
    case CommandOP.addChild:
      parent.insert(createVirtualNode(cmd.child))
      break
    case CommandOP.replaceChild:
      parent.replace(createVirtualNode(cmd.child))
      break
    case CommandOP.removeChild:
      parent.replace(createVirtualNode(cmd.child))
      break
  }
}


export function runOverrides (overrides: OverrideModule<any, { type: string }, PatchCommand[]>[], props: Record<string, any>, draft: LayoutTreeProxyDraft) {
  // patch layout
  overrides.forEach(override => {
    const patchLayoutCommands = override.patchLayout(props, draft)

    patchLayoutCommands.forEach(cmd => {
      doPatchLayoutCommand(cmd, draft)
    })
  })
}