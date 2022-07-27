import mainHook from '../../drivers/main'
import React, { useEffect } from 'react'
import { useProgress, useTarat } from 'tarat-connect'
import { useLocation, Navigate } from 'react-router-dom'
import s from './main.module.less'
import Comments from '../../views/comments'

export default function Main () {
  const location = useLocation()
  const main = useTarat(mainHook)
  const mainProgress = useProgress(main)

  console.log('main.notLogin(): ', mainProgress?.state, main.notLogin());

  const notLogin = main.notLogin()

  return (
    <div className={s.mainBox}>
      {notLogin ? <Navigate to="/login" replace={true} /> : ''}

      <Comments />
    </div>
  )
}
