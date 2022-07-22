import {
  after,
  combineLatest,
  computed,
  inputCompute,
  inputComputeInServer,
  model,
  state
} from 'tarat-core'

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
      if (posts()[0]) {
        posts(arr => {
          arr[0].content = inputMD()
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

/*--tarat deps start--*/
const deps = {'mdEditor':[['h',2,[0]],['h',3,[2]],['h',4,[0,2,1],[2,0]]]}
Object.assign(mdEditor, { __deps__: deps.mdEditor, __name__: 'mdEditor' })
/*--tarat deps end--*/
