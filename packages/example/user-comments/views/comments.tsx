import mainHook from '../drivers/main'
import topicDriver from '../drivers/topic'
import { useTarat, useProgress, useDriver } from 'tarat-connect'
import React, { useState } from 'react'
import s from './comments.module.less'

const LoginAction: React.FC<{
  onLogin?: () => void
  onSign?: () => void
}> = props => {
  return (
    <div className={s.loginAction}>
      <button onClick={props.onLogin} >去登录</button>
      <button onClick={props.onSign}>去注册</button>
    </div>
  )
}

const Comments = () => {

  const main = useTarat(mainHook)
  const mainProgress = useProgress(main)

  console.log('main.notLogin(): ', mainProgress?.state, main.notLogin());

  const notLogin = main.notLogin()

  const topic = useTarat(topicDriver)

  return (
    <div className={s.comments}>
      {notLogin ? (
        <LoginAction />
      ) : ''}

      <div className={s.header} >
        <input value={topic.inputName()} onChange={e => {
          topic.inputName(() => e.target.value)
        }} />
      </div>

    </div>
  )
 }

export default Comments