import mainHook from '../../drivers/main'
import React, { useEffect } from 'react'
import { useProgress, useTarat } from 'tarat-connect'
import Todos from '../../views/todos'
import { useLocation, Navigate } from 'react-router-dom'

export default function Main () {
  const location = useLocation()
  console.log('location: ', location);
  const main = useTarat(mainHook)
  const mainProgress = useProgress(main)

  console.log('main.alreadyLogin(): ', mainProgress?.state, main.alreadyLogin());

  const isLogin = main.alreadyLogin()

  useEffect(() => {

  }, [isLogin])

  return (
    <div>
      {!isLogin && mainProgress?.state === 'idle' ? <Navigate to="/login" replace={true} /> : ''}

      <p>
        alreadyLogin: {String(isLogin)}
      </p>

      <Todos />
    </div>
  )
}
