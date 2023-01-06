#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import * as parser from './src/index.js';

const argv = process.argv;
const cwd = process.cwd();

const dts = argv.filter(p => {
  return /\.k6\.d\.ts/.test(p);
});
dts.forEach((p) => {

  const fullFilePath = path.join(cwd, p);

  const code = fs.readFileSync(fullFilePath).toString();

  const targetFilePath = fullFilePath.replace(/\.d\.ts/, '.json');

  const obj = parser.parseCode2JSON(code);

  fs.writeFileSync(targetFilePath, JSON.stringify(obj, null, 2));

  console.log('parse done:', targetFilePath);
});
