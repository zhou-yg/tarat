import mainHook from '../drivers/main'
import { useTarat, useProgress } from 'tarat-connect'
import React, { useState } from 'react'
import s from './comments.module.less'

const Comments = () => {

  const main = useTarat(mainHook)
  const mainProgress = useProgress(main)

  console.log('main.notLogin(): ', mainProgress?.state, main.notLogin());

  const notLogin = main.notLogin()

  return (
    <div className={s.comments}>
      {notLogin ? (
        <div>
          <button>去登录</button>
        </div>
      ) : ''}

    </div>
  )
 }

export default Comments