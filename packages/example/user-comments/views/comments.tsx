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

  return (
    <div className={s.comments}>
      {notLogin ? (
        <LoginAction />
      ) : ''}

      <div className={s.header} >
        <label htmlFor="inputName">
          topic:
        </label>
        <input id="inputName" value={main.inputName()} onChange={e => {
          main.inputName(() => e.target.value)
        }} />
        <button onClick={() => main.add() }>create</button>
      </div>

      {main.topics().length ? '' : (
        <div className={s.noTopic}>
          no topic
        </div>
      )}
      <div className={s.topics}>
        <ol>
          {main.topics().map((o, i) => {
            return (
              <li key={o.id} className={s.topicOne}>
                <div className={s.title}>
                  {i + 1}.&nbsp;
                  {o.title}
                </div>
                <span className={s.close} onClick={() => main.removeTopic(o.id)}>
                  X
                </span>
              </li>
            )
          })}
        </ol>
      </div>

    </div>
  )
 }

export default Comments