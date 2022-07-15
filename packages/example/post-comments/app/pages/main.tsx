import React, { createContext, useState } from 'react'
import s from './main.module.less'
import TopicList from '../../views/topicList'
import { Link, Outlet } from 'react-router-dom'
import Radio, { RadioChangeEvent } from 'antd/lib/radio/index'
import 'antd/dist/antd.css'

const roles = {
  0: {
    name: 'zhou-yg',
    id: 0,
  },
  1: {
    name: 'Imperius',
    id: 1,
  },
  2: {
    name: 'Diablo',
    id: 2,
  },
}

export const RoleContext = createContext<typeof roles['0']>(null)

export default function Main () {
  const [value, setValue] = useState(0);

  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
  }

  const currentRole = roles[value]

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
      <div className={s.topics}>
        <RoleContext.Provider value={currentRole}>
          <Outlet />
        </RoleContext.Provider>
        <div>
          <p>
            current: <span style={{ fontWeight: 'bold' }}>{currentRole.name}</span> ({currentRole.id})
          </p>
          <span style={{ marginRight: '10px' }}>
            select role:
          </span>
          <Radio.Group onChange={onChange} value={value}>
            <Radio value={0}>zhouyg</Radio>
            <Radio value={1}>angel</Radio>
            <Radio value={2}>evil</Radio>
          </Radio.Group>
        </div>
      </div>
    </div>
  )
}
