import { writeFileSync } from 'fs'


function pushContext () {
  writeFileSync('./a.js', '123')
}
export function popContext () {
  // pushContext()
}

export function signal () {
  
}

export function action () {

}

export function effect () {

}
