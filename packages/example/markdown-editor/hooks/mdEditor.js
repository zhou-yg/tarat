import {
  after,
  combineLatest,
  computed,
  inputCompute,
  inputComputeInServer,
  model,
  state
} from 'tarat-core'

import deps from './mdEditor.deps.js'

Object.assign(mdEditor, {
  __deps__: deps.mdEditor
})

export default function mdEditor (q = {}) {
  const currentId = state(q.id)
  const inputMD = state('')

  const posts = model('markdown', () => {
    const cid = currentId()
    if (cid) {
      return {
        where: {
          id: cid,
        }
      }
    }
  })

  const postedMD = computed(() => {
    return posts()[0]?.content
  })

  const displayMD = combineLatest([inputMD, postedMD])

  const save = inputComputeInServer(async () => {
    const cid = currentId()
    if (cid) {
      const i = posts.findIndex(p => p.id === cid)
      if (i > -1) {
        posts(arr => {
          arr[i].content = inputMD()
        })
      }
    } else {
      const r = await posts.create({
        content: inputMD()
      })
      currentId(() => r.id)
    }
  })

  after(() => {
  }, [posts])

  return {
    displayMD,
    postedMD,
    inputMD,
    save,
  }
}
