import React from 'react'
import s from './main.module.less'
import Editor from '../../views/editor'
import { Link, useLocation, useSearchParams } from 'react-router-dom'

export default function Main () {
  const searchParams = useSearchParams()
  const location = useLocation()
  
  const mdId = searchParams[0].get('id')

  return (
    <div className="px-4">
      <Link className="underline" to="/list" >&lt; back</Link>
      <Editor id={mdId ? parseInt(mdId) : mdId} />
    </div>
  )
}
