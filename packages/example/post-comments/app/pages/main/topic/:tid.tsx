import React, { useState } from 'react'
import s from '../index.module.less'
import { useLocation, useParams } from 'react-router-dom'

export default function Comments () {

  const param = useParams()

  return (
    <div className={s.comments}>
      topic: {JSON.stringify(param)}
    </div>
  )
}
