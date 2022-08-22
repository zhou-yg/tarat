import React, { forwardRef, useImperativeHandle } from 'react'
import { useTarat } from 'tarat-connect'
import login, { DEFAULT_AVATAR } from '../drivers/login'
import s from './login.module.less'
import classnames from 'classnames'

const UserInfo = (props, ref) => {
  const loginHook = useTarat(login)
  
  useImperativeHandle(ref, () => ({
    hook: loginHook
  }))

  const alreadyLogin = loginHook.alreadyLogin()

  const userData = loginHook.userData()

  return (
    <div className={`${s.login} shadow rounded`}>      
      {alreadyLogin ? (
        <div className="flex items-center flex-col">
          <div className="w-20 h-20 rounded-full">
            <img className="w-full h-full" src={userData.avatar || DEFAULT_AVATAR} />
          </div>
          <div className="mt-2 text-lg" >
            {userData.name}
          </div>
          <div className="mt-1 text-sm text-slate-300" >
            {userData.password}
          </div>
          <div className="mt-2">
            <button className="border-x border-y p-2" onClick={() => loginHook.logout()}>Logout</button>
          </div>
        </div>
      ) : 'not login'}
    </div>
  )
}

export default forwardRef(UserInfo)
