import React from 'react'
import Editor from '@/views/editor'
import mdEditor from '@/drivers/mdEditor'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useTarat, useProgress } from 'tarat/connect'

export default function Main () {
  const searchParams = useSearchParams()  
  const mdId = searchParams[0].get('id')
  const mdHook = useTarat(mdEditor, { id: mdId ? parseInt(mdId) : mdId })
  const editorProgress = useProgress(mdHook)
  console.log('editorProgress: ', editorProgress);

  return (
    <div className="px-4">
      <Link className="underline" to="/list" >&lt; back</Link>
      <Editor {...mdHook} editorProgress={editorProgress} />
    </div>
  )
}
