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

  let query = { id }

  const mdEditorHook = useTarat(mdEditor, query)

  return (
    <div className={s.editor}>
      <header className={s.header}>
        <button className={s.saveBtn} onClick={() => {
          mdEditorHook.save()
        }}>Save</button>
      </header>
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
  )
}