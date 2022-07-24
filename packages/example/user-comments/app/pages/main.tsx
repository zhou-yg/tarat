import mainHook from '../../drivers/main'
import React, { useEffect } from 'react'
import { useTarat } from 'tarat-connect'
import Todos from '../../views/todos'
import { useLocation, Navigate } from 'react-router-dom'

export default function Main () {
  const location = useLocation()
  console.log('location: ', location);
  const main = useTarat(mainHook)

  console.log('main.alreadyLogin(): ', main.alreadyLogin());

  const isLogin = main.alreadyLogin()

  useEffect(() => {

  }, [isLogin])

  return (
    <div>
      {!isLogin ? <Navigate to="/login" replace={true} /> : ''}

      <p>
        alreadyLogin: {String(isLogin)}
      </p>

      <Todos />
    </div>
  )
}
