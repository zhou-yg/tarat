import { isSignal } from 'atomic-signal'
import {
  VirtualLayoutJSON,
  LayoutTreeProxyDraft,
  StyleRule,
  PatternStructure,
  OverrideModule,
  StateManagementMatch,
  PatternStructureResult,
  LayoutTreeDraft,
  PropTypeValidator
} from './types'
import { deepClone } from './lib/deepClone'
import { css } from '@emotion/css'
import {
  CommandOP,
  LayoutStructTree,
  PatchCommand,
  BaseDataType
} from './types-layout'
import { typeDefaultValueFlagSymbol } from './lib/propTypes'

// (window as any).ecss = css;

export { isFunction } from './lib/serialize'

export function mergeFromProps(
  json: VirtualLayoutJSON,
  props: Record<string, any>,
  keys: string[]
) {
  keys.forEach(key => {
    const val = props[key]
    if (val) {
      if (json.props[key]) {
        json.props[key] = `${json.props[key]} ${val}`
      } else {
        json.props[key] = val
      }
    }
  })
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
export function checkSematic(sematic: string, props: VirtualLayoutJSON['props']) {
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

export function camelToLine(str: string) {
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
  op:
    | DraftOperatesEnum.insert
    | DraftOperatesEnum.replace
    | DraftOperatesEnum.remove // | 'add' | 'remove'
  path: string[]
  value: any
}

const ExportPropKey = 'props'
/**
 * source = div/p/span, path=['div'] => div, 1
 * source = div/span/span, path=['div', 'p'] => null, 1
 * source = div/p/span, path=['div', 'p', 'props'] => 2
 */
export function getVirtualNodesByPath(
  source: VirtualLayoutJSON,
  path: (string | number)[]
): [VirtualLayoutJSON[], number] {
  let current = [source]
  let i = 0
  for (; i < path.length; i++) {
    const tag = path[i]

    const newCurrent: VirtualLayoutJSON[] = []
    for (const node of current) {
      if (isVirtualNode(node)) {
        if (node.type === tag) {
          newCurrent.push(node)
        }
      }
    }
    if (newCurrent.length === 0) {
      break
    }
    const nextType = path[i + 1]
    const nextChildren = newCurrent
      .map(n => n.children.filter(n => isVirtualNode(n) && n.type === nextType))
      .flat() as VirtualLayoutJSON[]
    if (nextChildren.length === 0) {
      break
    }
    current = nextChildren
  }

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
  replace = 'replace'
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
  const target: VirtualLayoutJSON = source

  for (const patch of patches) {
    const { op, path, value } = patch

    if (value.condition === false) {
      continue
    }
    let [current, i] = getVirtualNodesByPath(target, path)

    switch (op) {
      case DraftOperatesEnum.replace:
        const restKeys = path.slice(i + 1)
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

function getPathsFromDraft(target: any): string[] {
  return target[handlerPathKeySymbol]
}

const draftOperationMethodSymbol = Symbol.for('draftOperationMethod')

const fakeProxyObjectSymbol = Symbol.for('fakeProxyObjectSymbol')

function isFake(obj: any) {
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
            return createProxy(
              Object.assign(() => {}, { [draftOperationMethodSymbol]: key }),
              pathArr
            )
          } else if (typeof v === 'object' || v === undefined || v === null) {
            return createProxy(
              v || { [fakeProxyObjectSymbol]: true },
              pathArr.concat(key)
            )
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
        // console.log('argArray: ', argArray);
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
            break
          case DraftOperatesEnum.replace:
            patches.push({
              op,
              path: currentPathArr,
              value: argArray[0]
            })
            break
        }
      }
    })
    return proxy
  }

  function commit() {}

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
export function buildLayoutNestedObj<T extends LayoutStructTree>(
  json: VirtualLayoutJSON
): LayoutTreeDraft {
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

function createVirtualNode(child: PatchCommand['child']) {
  return {
    ...child,
    id: -1,
    props: (child as any).props || {},
    flags: VirtualNodeTypeSymbol,
    type: child.type,
    children: child.children
  }
}

function doPatchLayoutCommand(cmd: PatchCommand, draft: LayoutTreeProxyDraft) {
  if (cmd.condition === false) {
    return
  }
  let parent = draft

  const paths = getPathsFromDraft(cmd.parent)

  paths.forEach(path => (parent = parent[path]))

  switch (cmd.op) {
    case CommandOP.addChild:
      parent[DraftOperatesEnum.insert](createVirtualNode(cmd.child))
      break
    case CommandOP.replaceChild:
      parent[DraftOperatesEnum.replace](createVirtualNode(cmd.child))
      break
    case CommandOP.removeChild:
      parent[DraftOperatesEnum.remove](createVirtualNode(cmd.child))
      break
  }
}

export function runOverrides(
  overrides: OverrideModule<any, { type: string }, PatchCommand[]>[],
  props: Record<string, any>,
  draft: LayoutTreeProxyDraft
) {
  // patch layout
  overrides.forEach(override => {
    // 兼容逻辑
    override.layout?.(props, draft)

    if (override.patchLayout) {
      const patchLayoutCommands = override.patchLayout(props, draft)

      patchLayoutCommands.forEach(cmd => {
        doPatchLayoutCommand(cmd, draft)
      })
    }
  })
}

export function assignDefaultValueByPropTypes<T extends Record<string, any>>(
  props: T,
  propTypes?: Record<string, PropTypeValidator>
): T {
  if (!propTypes) {
    return props
  }

  const r: Record<string, any> = {}
  Object.keys(propTypes).forEach(key => {
    if (props[key] === undefined) {
      const defaultValue = propTypes?.[key]?.[typeDefaultValueFlagSymbol]
      if (defaultValue !== undefined) {
        if (isSignal(defaultValue)) {
          console.error(`[propTypes] props.${key} is return a signal directly, it maybe cause some unexpected error.`)
        }
        r[key] = typeof defaultValue === 'function' ? defaultValue() : defaultValue
      }
    }
  })

  return Object.assign({}, props, r)
}

export const ShouldRenderAttr = 'if'
export function shouldNotRender (json: VirtualLayoutJSON) {
  return typeof json?.type !== 'function' &&(
    json?.props?.if === false ||
    json?.props?.if === null)
}