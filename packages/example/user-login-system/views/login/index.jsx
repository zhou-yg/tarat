import React from 'react'
import { useTarat } from 'tarat-connect'
import login from '../../hooks/login'
import s from './index.module.less'
import classnames from 'classnames'

const LoginFrame = () => {
  const loginHook = useTarat(login)
  
  const cls = classnames(s.row, {
    show: !!loginHook?.errorTip()
  })

  const alreadyLogin = loginHook.alreadyLogin()
  console.log('alreadyLogin: ', alreadyLogin);

  return (
    <div className={s.login}>
      <div className={s.title}>Welcome</div>
      
      {alreadyLogin ? (
        <>
          <div className={s.row} >
            账号：{loginHook.userData().name}
          </div>
          <div className={s.row} >
            密码：{loginHook.userData().password}
          </div>
          <div className={s.footer}>
            <div>
              <button onClick={() => loginHook.logout()}>Logout</button>
            </div>
            <div>
            </div>
          </div>
        </>
      ) : 
        <>
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
          {loginHook?.errorTip() ? (
            <div className={cls}>
              {loginHook?.errorTip()}
            </div>
          ) : ''}
          <div className={s.footer}>
            <div>
              <button onClick={() => loginHook.sign()}>Sign</button>
              sign and auto login <input type="checkbox" checked={loginHook.signAndAutoLogin()} onChange={e => {
                loginHook.signAndAutoLogin(() => e.target.checked)
              }} />
            </div>
            <div>
              <button onClick={() => loginHook.login()}>Login</button>
            </div>
          </div>
        </>
      }

      <pre>
        <code>
          alreadyLogin(): {String(loginHook.alreadyLogin())} <br/>
          signAndAutoLogin(): {String(loginHook.signAndAutoLogin())} <br/>
          errorTip: {String(loginHook.errorTip())} <br/>
        </code>
      </pre>
    </div>
  )
}

export default LoginFrame
