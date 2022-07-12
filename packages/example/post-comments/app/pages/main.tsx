import React, { useState } from 'react'
import s from './main.module.less'
import TopicList from '../../views/topicList'

export default function Main () {
  return (
    <div className={s.main}>
      <div className={s.content}>
        <TopicList />
      </div>
    </div>
  )
}
