import React from 'react'
import s from './editor.module.less'
import MDEditor from 'react-markdown-editor-lite'

import MarkdownIt from 'markdown-it';
// import style manually
import 'react-markdown-editor-lite/lib/index.css';

// Initialize a markdown parser
const mdParser = new MarkdownIt(/* Markdown-it options */);

export default function Editor (props) {
  const { height = 800, editorProgress, ...rest } = props

  const mdEditorHook =  rest; // useTarat(mdEditor, query)

  const defualtMD = mdEditorHook.displayMD()

  return (
    <div className={s.editor}>
      <header className="my-2">
        <button className="bg-black text-white px-4 py-1" onClick={() => {
          mdEditorHook.save()
        }}>Save Markdown</button>
      </header>
      <div className="my-2">
        <input
          value={mdEditorHook.displayTitle()}
          onChange={e => mdEditorHook.inputTitle(() => e.target.value)}
          className="p-2 w-full border-x border-y" placeholder="markdown title" />
      </div>
      {editorProgress.state === 'idle' ? (
        <div className="my-2">
          <MDEditor
            defaultValue={defualtMD}
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
      ) : ''}
    </div>
  )
}