import {
  computed,
  state,
  computedInServer,
} from 'tarat-core'
import axios from 'axios'

export default function uploader<T> () {
  // only in browser
  const inputFile = state<{ name: string }>()

  const OSSLink = computedInServer(function * () {
    const file = inputFile()
    if (file) {
      return axios.get
    }
    return 'b'
  })
  

  return {
    inputFile,
    OSSLink
  }
}