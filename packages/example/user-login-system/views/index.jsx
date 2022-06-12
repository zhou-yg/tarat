import { useHook } from 'tarat-core'
import React, { useState } from 'react'
import login from '../hooks/login.js'
import '../styles/index.less'


const LoginFrame = () => {

  const loginHook = useHook(login)
  
  return (
    <div className="login">
      
    </div>
  )
}

document.title = 'Welcome!'

export default LoginFrame
