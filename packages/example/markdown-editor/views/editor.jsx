import React from 'react'
import s from './editor.module.less'
import MDEditor from 'react-markdown-editor-lite'

import MarkdownIt from 'markdown-it';
// import style manually
import 'react-markdown-editor-lite/lib/index.css';

import mdEditor from '../drivers/mdEditor'

import { useTarat } from 'tarat-connect'

// Initialize a markdown parser
const mdParser = new MarkdownIt(/* Markdown-it options */);

export default function Editor (props) {
  const { id, height = 800 } = props
  console.log('[Editor] id: ', id);

  let query = { id }

  const mdEditorHook = useTarat(mdEditor, query)

  return (
    <div className={s.editor}>
      <header className={s.header}>
        <button className="bg-black text-white px-4 py-1" onClick={() => {
          mdEditorHook.save()
        }}>Save Markdown</button>
      </header>
      <div className="p-2">
        <input
          value={mdEditorHook.displayTitle()}
          onChange={e => mdEditorHook.inputTitle(() => e.target.value)}
          className="p-2 w-full border-x border-y" placeholder="markdown title" />
      </div>
      <div className="p-2">
        <MDEditor
          defaultValue={mdEditorHook.displayMD() || ''}
          style={{ height: `${height}px` }}
          renderHTML={text => {
            return mdParser.render(text)
          }}
          onChange={(v) => {
            setTimeout(() => {
              mdEditorHook.inputMD(() => v.text)
            })
          }} />
        </div>
    </div>
  )
}