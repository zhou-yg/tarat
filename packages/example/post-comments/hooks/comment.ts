import {
  inputCompute,
  state,
  model,
  inputComputeInServer,
  computed
} from 'tarat-core'


interface IComment {
  id?: number
  name: string
  authorId: number
  content: string
  likeCount?: number
  topicId: number
  replyCommentId?: number
}

interface ICommentProps {
  name: string
  authorId: number
}

export default function comment (props: ICommentProps) {

  const { name, authorId } = props

  const currentTopic = state()

  const comments = model<IComment[]>('comment', () => {
    const tid = currentTopic()
    if (tid) {
      return {
        where: {
          topicId: tid
        },
        include: {
          appendComments: true
        }
      }
    }
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
    const cid = currentTopic()
    const content = inputComment()
    if (content && cid) {
      comments(arr => {
        arr.push({
          topicId: cid,
          content,
          name,
          authorId,
          replyCommentId: replyCommentId()
        })
      })
    }
  })

  return {
    comments,
    
    like,
    dislike,

    inputComment,
    replyCommentId,
    createComment
  }
}