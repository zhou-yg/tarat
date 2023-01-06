import ts from 'typescript'

export function logNode(pre, node) {
  if (node) {
    [].concat(node).forEach(node => {
      const p = node.parent;
      if (node.parent) {
        delete node.parent;
      }
      console.log(pre, `${ts.SyntaxKind[node.kind]} :`, node);    
      if (p) {
        node.parent = p;
      }
    });
  } else {
    console.log('node is undefined');
  }
}

export function printAST(code, node, depth = 0) {
  console.log(
    new Array(depth + 1).join('----'), 
    ts.SyntaxKind[node.kind],
    `(${node.kind})`,
    code.substring(node.pos, node.end),
    // node.pos,
    // node.end
  );
  depth++;
  node.getChildren().forEach(c => printAST(code, c, depth));
}

export function parse2AST(code) {
  const f = ts.createSourceFile('code.ts', code, ts.ScriptTarget.Latest, true);
  return f;
}


export function parseCode2JSON(code) {
  const ast = parse2AST(code);

  const syntaxList = ast.getChildren()[0]; // 顶部类型定义块

  collectEnum(syntaxList.getChildren())
  // top decalare
  const topInterfaces = getInterfaces(syntaxList.getChildren());

  const topName = topInterfaces[0].name.escapedText;
  const topObj = getProp(topName, 'object');

  readMembers(topInterfaces[0], topObj);

  return topObj;
}

// @TODO 暂停
function collectEnum(nodeArr) {
  const enumNodes = nodeArr.filter(n => {
    return ts.isEnumDeclaration(n);
  });
  // logNode('[collectEnum]', enumNodes[0].members[0]);
}


function getInterfaces(nodeArr) {
  const nodes = nodeArr.filter(n => {
    return (ts.isInterfaceDeclaration(n));
  });
  
  return nodes;
}

function getProp(name, type, description, properties = []) {
  return {
    name,
    type,
    description: description || name,    
    properties,
  };
}

function handleUnionTypes(node, current) {
  const { jsDocNode, typeValueNode } = resortNodeChildren(node);
  const name = node.name.escapedText;

  const desc = getPropDesc(jsDocNode);

  const enumObj = getProp(name, 'enum', desc);
  current.properties.push(enumObj);

  typeValueNode.types.forEach(typeNode => {
    const typeStringName = typeNode.literal.text;

    enumObj.properties.push(
      getProp(typeStringName, 'string')
    );
  });
}

function handleOtherTypes(node, current) {
  const { jsDocNode, typeValueNode } = resortNodeChildren(node);
  const name = node.name.escapedText;

  const desc = getPropDesc(jsDocNode);

  switch (typeValueNode.kind) {
    case ts.SyntaxKind.TypeReference:
      {
        const [identifyNode, _, SyntaxList] = typeValueNode.getChildren();
        const referenceName = identifyNode.escapedText;

        switch (referenceName) {
          // 内置类型的泛型引用
          case 'Array':
            {
              const newCurrent = getProp(name, 'array', desc);
              current.properties.push(
                newCurrent
              );
              const literalNode = SyntaxList.getChildren()[0];
              readMembers(literalNode, newCurrent);
            }
            break;
          default:
            {
              // 自定义类型，2种可能，1.复用其它定义，2.代表了完全自定义
              const newCurrent = getProp(name, referenceName, desc);
              current.properties.push(
                newCurrent
              );
            }
            break;
        }        
      }
      break;
  }
}

const basicTypeMap = {
  [ts.SyntaxKind.NumberKeyword]: 'number',
  [ts.SyntaxKind.BooleanKeyword]: 'boolean',
  [ts.SyntaxKind.StringKeyword]: 'string',
};

function resortNodeChildren(memberNode) {
  const children = memberNode.getChildren();
  let idNode;
  let tokenNode;
  let typeValueNode;
  let endTokenNode;
  let jsDocNode;

  children.forEach(n => {
    switch (n.kind) {
      case ts.SyntaxKind.JSDocComment:
        jsDocNode = n;
        break;
      case ts.SyntaxKind.Identifier:
        idNode = n;
        break;
      case ts.SyntaxKind.ColonToken:
        tokenNode = n;
        break;
      case ts.SyntaxKind.CommaToken:
      case ts.SyntaxKind.SemicolonToken:
        endTokenNode = n;
        break;
      default:
        typeValueNode = n;
        break;
    }
  });
  return {
    jsDocNode,
    idNode,
    tokenNode,
    typeValueNode,
    endTokenNode,
  };
}

function getPropDesc(jsDocNode) {
  if (jsDocNode) {
    if (jsDocNode.tags) {
      const nameTag = jsDocNode.tags.filter(tag => {
        return tag.tagName.escapedText === 'name';
      })[0];
      if (nameTag) {
        return nameTag.comment;
      } else {
        return jsDocNode.comment;
      }
    } else {
      return jsDocNode.comment;
    }
  }
}

function readMembers(node, current) {
  switch (node.kind) {
    // 适用的类型声明的例子：number[] -> number
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.StringKeyword:
      {
        const typeName = basicTypeMap[node.kind];
        current.properties.push(
          getProp('', typeName)
        );
      }
      break;
    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.TypeLiteral:
      {
        node.members.forEach(memberNode => {
          
          const { jsDocNode, typeValueNode } = resortNodeChildren(memberNode);
          const propName = memberNode.name.escapedText;

          const desc = getPropDesc(jsDocNode);

          switch (typeValueNode.kind) {
            case ts.SyntaxKind.NumberKeyword:
            case ts.SyntaxKind.BooleanKeyword:
            case ts.SyntaxKind.StringKeyword:
              {
                const typeName = basicTypeMap[typeValueNode.kind];
                current.properties.push(
                  getProp(propName, typeName, desc)
                );
              }
              break;
            case ts.SyntaxKind.TypeLiteral:
              {
                let newCurrent = getProp(propName, 'object', desc);            
                current.properties.push(              
                  newCurrent
                );
                readMembers(typeValueNode, newCurrent);
              }
              break;
            case ts.SyntaxKind.ArrayType:
              {
                let newCurrent = getProp(propName, 'array', desc);
                current.properties.push(
                  newCurrent
                );
                // 适用的类型声明：number[]; boolean[]; string[];
                readMembers(typeValueNode.elementType, newCurrent);                
              }
              break;
            case ts.SyntaxKind.TypeReference:
              {
                handleOtherTypes(memberNode, current);
              }
              break;
            case ts.SyntaxKind.UnionType:
              {
                handleUnionTypes(memberNode, current);
              }
              break;
            default:
              console.log('unhandle interface prop type:', ts.SyntaxKind[typeValueNode.kind]);
              break;
          }
        });
      }
      break;
  }
}
