import { useHook } from 'tarat-core'
import React, { useState } from 'react'
import login from '../hooks/login.js'
import s from '../styles/index.module.less'
import classnames from 'classnames'

const LoginFrame = () => {
  const loginHook = useHook(login)

  const cls = classnames(s.row, {
    show: !!loginHook?.errorTip()
  })

  return (
    <div className={s.login}>
      <div className={s.title}>Welcome</div>
      
      <div className={s.row} >
        <input placeholder="username" onInput={e => {
          loginHook.inputName(() => e.target.value)
        }}  />
      </div>
      <div className={s.row} >
        <input placeholder="password" onInput={e => {
          loginHook.inputPassword(() => e.target.value)
        }}  />
      </div>
      <div className={cls}>
        {loginHook?.errorTip()}
      </div>

      <pre>
        <code>
          loginHook?.alreadyLogin(): {String(loginHook?.alreadyLogin())}
        </code>
      </pre>
    </div>
  )
}

document.title = 'Welcome!'

export default LoginFrame
