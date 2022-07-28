import React, { useEffect } from 'react'
import s from './main.module.less'
import Comments from '../../views/comments'

export default function Main () {

  return (
    <div className={s.mainBox}>

      <Comments />
    </div>
  )
}
