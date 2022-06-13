import { useHook } from 'tarat-core'
import React, { useState } from 'react'
import login from '../hooks/login.js'
import s from '../styles/index.module.less'


const LoginFrame = () => {
  const loginHook = useHook(login)

  console.log('loginHook?.alreadyLogin(): ', loginHook?.alreadyLogin());

  return (
    <div className={s.login}>
      <div className={s.title}>Welcome</div>

      <div>
        login: {loginHook?.alreadyLogin()}
      </div>
    </div>
  )
}

document.title = 'Welcome!'

export default LoginFrame
