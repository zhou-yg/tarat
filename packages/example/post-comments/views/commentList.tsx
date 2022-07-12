import React, { ReactElement, useState } from 'react'

import s from './commentList.module.less'
import { useTarat } from 'tarat-connect'
import topicHook, { ITopic } from '../hooks/topic'
import List from 'antd/lib/list/index'
import Button from 'antd/lib/button/index'
import Input from 'antd/lib/input/index'


import 'antd/dist/antd.css'
import commentHook from 'hooks/comment'

const CommentList: React.FC<{
  topicId: number,
  name: string
  authorId: number
  renderItem?: (e: ITopic, i: number) => ReactElement
}> = (props) => {

  const comment = useTarat(commentHook, [{
    topicId: props.topicId,
    name: props.name,
    authorId: props.authorId
  }])

  return (
    <div className={s.commentList}>

    </div>
  )
}


export default CommentList
