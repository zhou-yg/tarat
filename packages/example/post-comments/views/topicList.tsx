import React, { useState } from 'react'

import s from './TopicList.module.less'
import { useTarat } from 'tarat-connect'
import topicHook from '../hooks/topic'
import List from 'antd/lib/list/index'
import Button from 'antd/lib/button/index'
import Input from 'antd/lib/input/index'


import 'antd/dist/antd.css'

export default function TopicList () {
  const topic = useTarat(topicHook)
  
  function creatTopic () {
    topic.add()
  }

  return (
    <div className={s.topicList}>
      <header className={s.title}>
        top topics
      </header>
      <div className={s.newTopic}>
        <Input placeholder="new topic name" value={topic.inputName()} onChange={e => topic.inputName(() => e.target.value)} />
        <Button onClick={creatTopic} type="primary">create topic</Button>
      </div>

      <List
        bordered
        dataSource={topic.topics()}
        renderItem={(item, i) => {
          return (
            <List.Item >
              <div>
                {i+1}.{item.title}
              </div>
            </List.Item>
          )
        }}>
      </List>
    </div>
  )
}
