import * as parser from '../src/index.js';
import * as fs from 'fs';
import * as path from 'path';

const dir = path.dirname(import.meta.url).replace('file:', '');
const p = path.join(dir, './node.k6.d.ts');

const code =  fs.readFileSync(
  p
).toString();

const ast = parser.parse2AST(code);

parser.printAST(code, ast);

const topObj = parser.parseCode2JSON(code);

const r = (JSON.stringify(topObj, null, 2));

fs.writeFileSync(path.join(dir, './node.k6.json'), r);