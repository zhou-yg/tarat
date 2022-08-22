import React from 'react'
import { useProgress, useTarat } from 'tarat-connect'
import UserInfo from '../../../views/info'
import login from '../../../drivers/login'
import { Navigate } from 'react-router-dom'

export default function User () {
  const loginHook = useTarat(login)
  const progress = useProgress(loginHook)  
  const notLogin = progress.state === 'idle' && !loginHook.alreadyLogin()
  console.log('notLogin: ', progress.state, loginHook.alreadyLogin(), '=>', notLogin);
  
  return (
    <div className="h-screen flex items-center justify-center" >
      {notLogin ? <Navigate to="/login" replace={true} /> : ''}
      <UserInfo />
    </div>
  )
}