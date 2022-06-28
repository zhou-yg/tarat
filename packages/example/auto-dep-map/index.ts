import { parse } from "./parser.js";
import { readFileSync } from 'fs'


const hookJs = readFileSync('./hooks/login.js').toString()

parse(hookJs)