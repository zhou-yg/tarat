import React, { useEffect, useRef } from 'react'
import { useLocation, Navigate } from 'react-router-dom'

import LoginFrame from 'user-login-system/dist/views/login'
import 'user-login-system/dist/views/login.css'

import { after } from 'tarat-core'

export default function Login () {
  
  const loginRef = useRef<{ hook: any }>()

  useEffect(() => {
    if (loginRef.current) {
      after(() => {
        console.log('loginRef.current.alreadyLogin', loginRef.current.hook.alreadyLogin());
      }, [loginRef.current.hook.alreadyLogin])
    }
  }, [])

  return (
    <div>
      you need login <br/>

      <LoginFrame ref={loginRef} />
    </div>
  )
}