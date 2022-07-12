import React, { useState } from 'react'
import s from './main/index.module.less'
import TopicList from '../../views/topicList'
import { Link, Outlet } from 'react-router-dom'

export default function Main () {
  return (
    <div className={s.main}>
      <div className={s.content}>
        <TopicList renderItem={(v, i) => {
          return (
            <Link to={`topic/${v.id}`} className={s.item}>
              <span>
                {i+1}.{v.title}
              </span>
              <span>&gt;</span>
            </Link>
          )
        }} />
      </div>
      <Outlet />
    </div>
  )
}
