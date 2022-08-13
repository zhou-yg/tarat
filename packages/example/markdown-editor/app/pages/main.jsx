import React from 'react'
import s from './main.module.less'
import Editor from '../../views/editor'
import { useLocation, useSearchParams } from 'react-router-dom'

export default function Main () {
  const searchParams = useSearchParams()

  const mdId = searchParams[0].get('id')

  return (
    <div className={s.index}>
      <Editor id={mdId} />
    </div>
  )
}
