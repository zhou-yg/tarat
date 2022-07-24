import React, { ReactElement, useState } from 'react'

import s from './topicList.module.less'
import { useTarat } from 'tarat-connect'
import topicHook, { ITopic } from '../drivers/topic'
import List from 'antd/lib/list/index'
import Button from 'antd/lib/button/index'
import Input from 'antd/lib/input/index'

const TopicList: React.FC<{
  renderItem?: (e: ITopic, i: number) => ReactElement
}> = (props) => {
  const { renderItem = (v, i) => `${i}.${v.title}` } = props

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
              {renderItem(item, i)}
            </List.Item>
          )
        }}>
      </List>
    </div>
  )
}

export default TopicList