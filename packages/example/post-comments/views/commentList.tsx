import React, { ReactElement, useEffect, useState } from 'react'

import s from './commentList.module.less'
import { useTarat } from 'tarat-connect'
import List from 'antd/lib/list/index'
import Button from 'antd/lib/button/index'
import Input from 'antd/lib/input/index'
import Comment from 'antd/lib/comment/index'

import 'antd/dist/antd.css'
import commentHook, { ICommentTree } from '../hooks/comment'
import topicOneHook from '../hooks/topicOne'

import LikeOutlined from '@ant-design/icons/LikeOutlined';
import UndoOutlined from '@ant-design/icons/UndoOutlined'
import CommentOutlined from '@ant-design/icons/CommentOutlined'

import * as dateFns from 'date-fns'

const CommentChildren: React.FC<{
  comment: ReturnType<typeof commentHook>
  tree: ICommentTree[]
}> = props => {
  const { comment, tree } = props
  return (
    <List
      dataSource={tree}
      bordered
      renderItem={(item, i) => {
        return (
          <List.Item>
            <Comment
              className={s.commentOne}
              author={<>
                <span>{item.name}</span>
                <span className={s.sub}>（{item.authorId}）</span>
              </>}
              content={<div className={s.content}>{item.content}</div>}
              datetime={dateFns.formatDistanceToNow(new Date(item.createdAt!))}
              actions={[
                <span key="like" className={s.like}>
                  <LikeOutlined />
                </span>,
                <span key="comment-basic-reply-to" className={s.reply} onClick={() => {
                  comment.replyCommentId(() => item.id)
                }}><CommentOutlined /></span>
              ]}
            >
            {item.children.length > 0 ? <CommentChildren comment={comment} tree={item.children} /> : ''}
            </Comment>
          </List.Item>
        )
      }}>
    </List>
  )
}

const CommentList: React.FC<{
  topicId: number
  name: string
  authorId: number
}> = (props) => {

  const topicOne = useTarat(topicOneHook, { id: props.topicId })

  const comment = useTarat(commentHook, {
    topicId: props.topicId,
    name: props.name,
    authorId: props.authorId
  })

  useEffect(() => {
    comment.author(o => {
      o.name = props.name,
      o.id = props.authorId
    })
  }, [props.authorId])


  useEffect(() => {
    comment.topicId(() => props.topicId)
    topicOne.topicId(() => props.topicId)
  }, [props.topicId])

  return (
    <div className={s.commentList}>
      <h2>
        {topicOne.currentTopic()?.title}

        <span className={s.sub} style={{ marginLeft: '10px' }}>
          <UndoOutlined onClick={() => comment.refresh()} />
        </span>
      </h2>
      <CommentChildren comment={comment} tree={comment.commentTree()} />

      <div className={s.inputCommentBox}>
        {comment.replyTarget() ? <div className={s.replyTarget}>reply to: {comment.replyTarget()?.content}</div> : ''}
        <div className={s.inputCommentBox}>
          <Input
            showCount maxLength={200} bordered
            value={comment.inputComment()}
            onChange={e => comment.inputComment(() => e.target.value) }
            onKeyDown={e => {
              e.key === 'Enter' && comment.createComment() 
            }}/>
        </div>
        <div className={s.commentAction}>
          <Button type="primary" disabled={comment.inputComment()?.length === 0} onClick={() => {
            comment.createComment()
          }}>add comment</Button>
        </div>
      </div>
    </div>
  )
}


export default CommentList
