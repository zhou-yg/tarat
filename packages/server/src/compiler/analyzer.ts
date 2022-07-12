import acorn, { parse as acornParse } from 'acorn'

import * as walk from 'acorn-walk'
import { set, get } from 'lodash'
import type {
  ArrowFunctionExpression,
  AssignmentExpression,
  CallExpression, FunctionDeclaration,
  Identifier,
  MemberExpression,
  ObjectPattern,
  VariableDeclarator
} from 'estree'

import type { THookDeps } from 'tarat-core'


function isDef (v: any) {
  return v === undefined
}

const hookGenerateNames = [
  'state',
  'model',
  'cache',
  'computed',
  'inputCompute',
  'inputComputeInServer',
]

const composeName = 'compose'

/**
 * must use the export from tarat hoo
 */
function isHookCaller (node: CallExpression) {
  return node.type === 'CallExpression' && 
    (node.callee.type === 'Identifier' && hookGenerateNames.includes(node.callee.name))
}

function isComposeCaller (node: CallExpression) {
  return node.type === 'CallExpression' && 
    (node.callee.type === 'Identifier' && composeName === node.callee.name)
}

function getMemberExpressionKeys (m: MemberExpression, keys: string[] = []): string[] {
  if (m.property.type === 'Identifier' ) {
    const cur = m.property.name

    switch (m.object.type) {
      case 'MemberExpression':
        return getMemberExpressionKeys(m.object, keys.concat(cur))
        break;
      case 'Identifier':
        return keys.concat(m.object.name).concat(cur)
        break
      default:
        console.error((m as any).object)
        // throw new Error('[getMemberExpressionKeys] unexpect node type')
        break
    }
  }
  return keys
}

type TBMNode = FunctionDeclaration | ArrowFunctionExpression


interface IScopeValueBase {
  variablesNode: MemberExpression | Identifier
  sourceHook: CallExpression
  originIdentifier?: string
  type: string
}
interface IScopeValue extends IScopeValueBase {
  type: 'hook'
  hookIndex: number,
}
interface IScopeValue2 extends IScopeValueBase {
  type: 'compose'
  composeIndex: number,
}

interface IScopeMap {
  [key: string]: IScopeMap | IScopeValue | IScopeValue2
}
/**
 * all hooks must be called at top
 */
function collectHookVaraibles (BMNode: TBMNode) {

  const variables: (MemberExpression | Identifier)[] = []

  const scopeMap: IScopeMap = {}

  let hookIndex = 0
  let composeIndex = 0

  walk.ancestor(BMNode as any, {
    CallExpression(n, s, ancestor) {
      const isHook = isHookCaller(n as any as CallExpression)
      const isCompose = isComposeCaller(n as any as CallExpression)
      if (isHook || isCompose) {
        const hookVariable = ancestor[ancestor.length - 2] as any as AssignmentExpression | VariableDeclarator
        switch (hookVariable.type) {
          case 'AssignmentExpression':
            if (hookVariable.left.type === 'MemberExpression') {
              const memberKeys = getMemberExpressionKeys(hookVariable.left)
              
              if (isHook) {
                set(scopeMap, memberKeys, {
                  type: 'hook',
                  variablesNode: hookVariable.left,
                  sourceHook: n,
                  hookIndex: hookIndex++,
                })
              } else if (isCompose) {
                set(scopeMap, memberKeys, {
                  type: 'compose',
                  variablesNode: hookVariable.left,
                  sourceHook: n,
                  composeIndex: composeIndex++,
                })
              }
            }
            break
          case 'VariableDeclarator':
            {
              let names: { origin?: string, name: string }[] = []
              switch (hookVariable.id.type) {
                case 'Identifier':
                  names = [{
                    name: hookVariable.id.name
                  }]
                  break
                case 'ObjectPattern':
                  hookVariable.id.properties.forEach(p => {
                    switch (p.type) {
                      case 'Property':
                        if (p.key.type === 'Identifier' && p.value.type === 'Identifier') {
                          names.push({
                            origin: p.key.name,
                            name: p.value.name,
                          })
                        }
                        break
                      case 'RestElement':
                        throw new Error('to be supported')
                        break
                    }
                  })
                  break
              }

              if (isHook) {
                names.forEach(({ origin, name }) => {
                  set(scopeMap, name, {
                    type: 'hook',
                    variablesNode: hookVariable.id,
                    sourceHook: n,
                    hookIndex: hookIndex++,
                    originIdentifier: origin,
                  })
                })
              } else if (isCompose) {
                names.forEach(({ origin, name }) => {
                  set(scopeMap, name, {
                    type: 'compose',
                    variablesNode: hookVariable.id,
                    sourceHook: n,
                    originIdentifier: origin,
                    composeIndex: composeIndex++,
                  })
                })
              }
            }
            break
        }
      }
      // if (isCompose) {
      //   console.log('isCompose: ', ancestor);
      // }
    }
  })

  return scopeMap
}

function findInScopeMap (s: IScopeMap, targetHook: CallExpression) {
  let found: IScopeValue | IScopeValue2 | undefined
  Object.keys(s).forEach(k => {
    if (!found) {
      if (s[k].sourceHook) {
        // @ts-ignore
        const match = ['start', 'end'].every(p => s[k].sourceHook[p] === targetHook[p])
        if (match) {
          found = s[k] as IScopeValue
        }
      } else {
        found = findInScopeMap(s[k] as IScopeMap, targetHook)
      }
    }
  })
  return found
}

/**
 * find the callled hook caller in other caller hook
 */
type TOriginDepsMap = Map<number, {
  get: Set<THookDeps[0][2][0]>,
  set: Set<THookDeps[0][2][0]>,
}>
function collectCallerWithAncestor (BMNode: TBMNode, scope: IScopeMap) {
  const depsMap: TOriginDepsMap = new Map

  walk.ancestor(BMNode as any, {
    CallExpression (n, s, ancestor) {
      const { callee } = (n as any as CallExpression)
      const hasArguments = (n as any as CallExpression)['arguments']?.length > 0
      
      let existSourceInScope: CallExpression | undefined

      let lastCalleeName: string = ''

      switch (callee.type) {
        // scene: "callee()"
        case 'Identifier':
          const calleeName = callee.name
          const scopeValue = get(scope, calleeName)
          if (scopeValue) {
            existSourceInScope = scopeValue.sourceHook as CallExpression
          }
          lastCalleeName = calleeName
          break
        // scene: "xxx.callee()" or "otherComposeHookResult.xxxCallee()"
        case 'MemberExpression':
          const calleeKeys = getMemberExpressionKeys(callee)
          existSourceInScope = get(scope, calleeKeys.slice(0, -1))?.sourceHook as CallExpression
          lastCalleeName = calleeKeys[calleeKeys.length - 1]
          break
      }

      /** find which hook use this */
      if (existSourceInScope) {
        let i = ancestor.length - 2
        let parent: any = ancestor[i]
        
        let parentCallerHook: CallExpression | undefined;

        while (i >= 0 && parent) {
          if (parent.type === 'CallExpression') {
            if (isHookCaller(parent)) {
              parentCallerHook = parent
              break
            }
          }
          i--
          parent = ancestor[i]
        }
        if (parentCallerHook) {
          const v1 = findInScopeMap(scope, existSourceInScope)
          const parentCaller = findInScopeMap(scope, parentCallerHook)

          if (parentCaller?.type === 'hook') {
            let deps = depsMap.get(parentCaller.hookIndex)
            if (!deps) {
              deps = {
                get: new Set(),
                set: new Set()
              }
              depsMap.set(parentCaller.hookIndex, deps)
            }

            switch (v1?.type) {
              case 'hook':
                if (hasArguments) {
                  deps.set.add(v1.hookIndex)
                } else {
                  deps.get.add(v1.hookIndex)
                }  
                break
              case 'compose':
                let name = v1.originIdentifier ? v1.originIdentifier : lastCalleeName
                if (hasArguments) {
                  deps.set.add(['c', v1.composeIndex, name])
                } else {
                  deps.get.add(['c', v1.composeIndex, name])
                }
                break
            }
          }

        }
      }
    }
  })
  return depsMap
}

function convertDepsToJSON(m: TOriginDepsMap) {
  const arr: THookDeps = []

  for (const [k, v] of m.entries()) {
    const r: THookDeps[0] = [
      'h',
      k,
      [...v.get],
    ]
    if (v.set.size > 0) {
      r.push([...v.set])
    }
    arr.push(r)
  }
  return arr
}


function generateBMDepMaps (BMNode: TBMNode) {
  const scopeMap = collectHookVaraibles(BMNode)
  
  // console.log('scopeMap: ', scopeMap);

  const depsMap = collectCallerWithAncestor(BMNode, scopeMap)

  return depsMap
}

/**
 * BM defination: the function including above hook factory method.
 */
function matchBMFunction (ast:acorn.Node) {
  const BMNodes: ([acorn.Node, string])[] = []
  function func(parentFuncNode: acorn.Node, s:any, ancestor: any[]) {
    let found = false
    
    walk.ancestor(parentFuncNode, {
      CallExpression (n) {
        if (!found) {
          const r = isHookCaller(n as any as CallExpression)
          if (r) {
            found = true
            if (parentFuncNode.type === 'ArrowFunctionExpression') {
              const declaration: VariableDeclarator = ancestor[ancestor.length - 2] as VariableDeclarator
              if (!declaration.id) {
              }
              if (declaration.id.type === 'Identifier') {
                BMNodes.push(
                  [parentFuncNode, declaration.id.name]
                )
              }
            } else if (parentFuncNode.type === 'FunctionDeclaration') {
              if ((parentFuncNode as any as FunctionDeclaration).id?.type === 'Identifier') {
                BMNodes.push([parentFuncNode, (parentFuncNode as any as FunctionDeclaration).id!.name])
              }
            }
          }
        }
      }
    })
  }

  walk.ancestor(ast, {
    FunctionDeclaration: func,
    ArrowFunctionExpression: func,
  })

  return BMNodes
}

export function parseDeps (hookCode: string) {
  
  const ast = acornParse(hookCode, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  });

  const BMFunctionNodes = matchBMFunction(ast)

  const allBMDeps = BMFunctionNodes.map((n, i) => {
    if (i === 0) {
    }
    const deps = generateBMDepMaps((Array.isArray(n) ? n[0] : n) as any)
    
    const arr = convertDepsToJSON(deps)
    
    return  {
      [n[1]]: arr
    }
  }).reduce((p, n) => Object.assign(p, n), {})

  return allBMDeps
}
