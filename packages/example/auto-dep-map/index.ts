import { parse } from "./parser.js";
import { readFileSync, writeFileSync } from 'fs'


const hookJs = readFileSync('./hooks/login.js').toString()

const deps = parse(hookJs)

writeFileSync('./login.deps.json', JSON.stringify(deps, null, 2))