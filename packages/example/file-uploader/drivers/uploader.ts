import {
  computed,
  state,
  computedInServer,
} from 'tarat-core'

import axios from 'axios'

async function uploadFile (f: Buffer | File) {

}

export default function uploader () {
  // only in browser
  const inputFile = state<{ name: string }>()

  const OSSLink = computedInServer(function * () {
    const file = inputFile()
    if (file) {
      return 'a'
    }
    return 'b'
  })
  

  return {
    inputFile,
    OSSLink
  }
}