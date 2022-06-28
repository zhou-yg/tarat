import acorn, { parse as acornParse } from 'acorn'
import * as walk from 'acorn-walk'
import * as fs from 'fs'
import type {
  ArrowFunctionExpression,
  AssignmentExpression,
  CallExpression, FunctionDeclaration,
  Identifier,
  MemberExpression,
  VariableDeclarator
} from 'estree'
import { set, get } from 'lodash-es'

const hookGenerateNames = [
  'state',
  'model',
  'cache',
  'computed',
  'inputCompute',
  'inputComputeInServer',
]

/**
 * must use the export from tarat hoo
 */
function isHookCaller (node: CallExpression) {
  return node.type === 'CallExpression' && 
    (node.callee.type === 'Identifier' && hookGenerateNames.includes(node.callee.name))
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
        throw new Error('[getMemberExpressionKeys] unexpect node type')
        break
    }
  }
  return keys
}

type TBMNode = FunctionDeclaration | ArrowFunctionExpression


interface IScopeValue {
  variablesNode: MemberExpression | Identifier
  sourceHook: CallExpression
  hookIndex: number,
}

interface IScopeMap {
  [key: string]: IScopeMap | IScopeValue
}
/**
 * all hooks must be called at top
 */
function collectHookVaraibles (BMNode: TBMNode) {

  const variables: (MemberExpression | Identifier)[] = []

  const scopeMap: IScopeMap = {}

  let hookIndex = 0

  walk.ancestor(BMNode as any, {
    CallExpression(n, s, ancestor) {
      const isHook = isHookCaller(n as any as CallExpression)
      if (isHook) {
        const hookVariable = ancestor[ancestor.length - 2] as any as AssignmentExpression | VariableDeclarator
        switch (hookVariable.type) {
          case 'AssignmentExpression':
            if (hookVariable.left.type === 'MemberExpression') {
              const memberKeys = getMemberExpressionKeys(hookVariable.left)
              
              set(scopeMap, memberKeys, {
                variablesNode: hookVariable.left,
                sourceHook: n,
                hookIndex: hookIndex++,
              })
            }
            break
          case 'VariableDeclarator':
            if (hookVariable.id.type === 'Identifier') {
              set(scopeMap, hookVariable.id.name, {
                variablesNode: hookVariable.id,
                sourceHook: n,
                hookIndex: hookIndex++,
              })
            }
            break
        }
      }
    }
  })

  return scopeMap
}

function findInScopeMap (s: IScopeMap, targetHook: CallExpression) {
  let found: IScopeValue | undefined
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
function collectCallerWithAncestor (BMNode: TBMNode, scope: IScopeMap) {
  const depsMap: Map<number, Set<number>> = new Map

  walk.ancestor(BMNode as any, {
    CallExpression (n, s, ancestor) {
      const callee = (n as any as CallExpression).callee

      let existSourceInScope: CallExpression | undefined

      switch (callee.type) {
        case 'Identifier':
          const calleeName = callee.name
          existSourceInScope = get(scope, calleeName)?.sourceHook as CallExpression
          break
        case 'MemberExpression':
          const calleeKeys = getMemberExpressionKeys(callee)
          existSourceInScope = get(scope, calleeKeys)?.sourceHook as CallExpression
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
          const v2 = findInScopeMap(scope, parentCallerHook)

          if (v1 && v2) {
            let deps = depsMap.get(v2.hookIndex)
            if (!deps) {
              deps = new Set<number>()
              depsMap.set(v2.hookIndex, deps)
            }

            deps.add(v1.hookIndex)
          }
        }
      }
    }
  })
  return depsMap
}

function convertDepsToJSON(m: Map<number, Set<number>>) {
  const arr: ([number, number[]])[] = []

  for (const [k, v] of m.entries()) {
    arr.push([
      k,
      [...v]
    ])
  }
  return arr
}


function generateBMDepMaps (BMNode: TBMNode) {
  const scopeMap = collectHookVaraibles(BMNode)
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

export function parse (hookCode: string) {
  
  const ast = acornParse(hookCode, {
    ecmaVersion: 'latest',
    sourceType: 'module'
  });
  fs.writeFileSync('./login.ast.json', JSON.stringify(ast, null, 2))

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