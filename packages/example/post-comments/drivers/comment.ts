import { orderBy } from 'lodash'
import {
  inputCompute,
  state,
  model,
  inputComputeInServer,
  computed
} from 'tarat-core'
import { ITopic } from './topic'


interface IComment {
  id?: number
  name: string
  authorId: number
  content: string
  likeCount?: number
  topicId: number
  replyCommentId?: number
  createdAt?: string | Date
}

interface ICommentProps {
  name: string
  authorId: number
  topicId: number
}

export interface ICommentTree extends IComment {
  children: ICommentTree[]
  createdAt: Date
}

export default function comment (props: ICommentProps) {

  const { name, authorId } = props

  const author = state({
    name,
    id: authorId
  })

  const topicId = state(props.topicId)

  const commentReqTiming = state(Date.now())

  const comments = model<IComment[]>('comment', () => {
    // commentReqTiming()
    const tid = topicId()
    if (tid) {
      return {
        where: {
          topicId: tid
        },
      }
    }
  })

  const commentTree = computed(() => {
    const allComments = comments()
    const commentMap: { [k: string]: ICommentTree } = {}
    allComments.forEach(c => {
      commentMap[c.id!] = Object.assign({ children: [] }, {
        ...c,
        createdAt: !c.createdAt || typeof c.createdAt === 'string' ? new Date(c.createdAt) : c.createdAt
      })
    })

    const markRemoved: number[] = []

    Object.values(commentMap).forEach(c => {
      if (c.replyCommentId) {
        if (commentMap[c.replyCommentId]) {
          commentMap[c.replyCommentId].children.push(c)
          commentMap[c.replyCommentId].children.sort((p, n) => {
            return (p.createdAt.getTime() - n.createdAt.getTime())
          })
          markRemoved.push(c.id)
        }
      }
    })

    markRemoved.forEach(id => {
      delete commentMap[id]
    })

    const r = Object.values(commentMap)
    
    r.sort((p, n) => {
      return p.createdAt.getTime() - n.createdAt.getTime()
    })

    return r
  })

  const like = inputComputeInServer((cid: number) => {
    const index = comments().findIndex(c => c.id === cid)
    if (index > -1) {
      comments(arr => {
        arr[index].likeCount! += 1
      })
    }
  })
  const dislike = inputComputeInServer((cid: number) => {
    const index = comments().findIndex(c => c.id === cid)
    if (index > -1) {
      comments(arr => {
        if (arr[index].likeCount! > 0) {
          arr[index].likeCount! -= 1
        }
      })
    }
  })

  const inputComment = state('')
  const replyCommentId = state<number>()

  const createComment = inputComputeInServer(() => {
    const cid = topicId()
    const content = inputComment()
    if (content && cid) {
      comments(arr => {
        arr.push({
          topicId: cid,
          content,
          name: author().name,
          authorId: author().id,
          replyCommentId: replyCommentId()
        })
      })
      inputComment(() => '')
      replyCommentId(() => null)
    }
  })

  const replyTarget = computed(() => {
    const rpid = replyCommentId()
    if (rpid) {
      return comments().find(v => v.id === rpid)
    }
  })

  const refresh = inputComputeInServer(() => {
    // commentReqTiming(() => Date.now())
    comments.refresh()
  })

  return {
    topicId,
 
    author,
    comments,
    commentTree,
    
    like,
    dislike,

    replyTarget,

    inputComment,
    replyCommentId,
 
    createComment,
    refresh,
  }
}
/*--tarat deps start--*/
const deps = {'comment':[['h',3,[1]],['h',4,[3]],['h',5,[3],[3]],['h',6,[3],[3]],['h',9,[1,7,0,8],[3,7,8]],['h',10,[8,3]],['h',11,[3]]]}
Object.assign(comment, { __deps__: deps.comment, __name__: 'comment' })
/*--tarat deps end--*/
