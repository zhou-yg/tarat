import {
  computed,
  state,
} from 'tarat-core'

import axios from 'axios'

async function uploadFile (f: Buffer | File) {

}

export default function todo () {
  // only in browser
  const inputFile = state(0)

  const OSSLink = computed(function * () {
    const file = inputFile()
    if (file) {
      
    }
  })
  

  return {
    
  }
}