import React from 'react'
import s from './editor.module.less'
import MDEditor from 'react-markdown-editor-lite'
import { useLocation } from 'react-router-dom';

import MarkdownIt from 'markdown-it';
// import style manually
import 'react-markdown-editor-lite/lib/index.css';

import mdEditor from '../hooks/mdEditor'

import { useTarat } from 'tarat-connect'

// Initialize a markdown parser
const mdParser = new MarkdownIt(/* Markdown-it options */);

export default function Editor (props) {
  const { height = 800 } = props

  let query = { id: 1 }
  // if (typeof location !== undefined) {
  //   query = location.replace(/^\?/, '').split('&').map(kv => kv.split('=')).map(arr => ({
  //     [arr[0]]: arr[1]
  //   })).reduce((p, n) => Object.assign(p, n), {})
  // }

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