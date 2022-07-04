import React from 'react'
import { Outlet } from 'react-router-dom'

import s from './user.module.less'

export default function User () {

  return (
    <div className={s.user} >
      user

      <Outlet />
    </div>
  )
}