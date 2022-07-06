import React from 'react'
import s from './main.module.less'
import Editor from '../../views/editor'

export default function Main () {
  return (
    <div className={s.index}>
      <Editor />
    </div>
  )
}
