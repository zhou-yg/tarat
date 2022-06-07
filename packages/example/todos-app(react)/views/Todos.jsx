import { useHook } from '@tarot-run/core'
import React, { useState } from 'react'
import todoHook from '../hooks/todo.js'
import '../styles/home.less'

const TodoItem = (props) => {
  const checked = props.status === 'done'
  return (
    <div className="todoItem">
      <input className='status' type="checkbox" checked={checked} onChange={() => {
        props.onStatus(checked ? 'undone' : 'done')
      }} />
      <div className={"text " + (checked ? 'done' : '')}>
        {props.description}
      </div>
      <div className="remove" onClick={props.onRemove}>
        X
      </div>
    </div>
  )
}

const Todos = () => {

  const todo = useHook(todoHook)
  
  const [inputText, setInputText] = useState('')

  function keydownCreate (e) {
    if (e.keyCode === 13 || e.key === 'Enter') {
      todo?.createTodoItem(e.target.value)
      setInputText('')
    }
  }

  const undoneItemsNum = todo?.undoneItems()?.length

  return (
    <div className="home">
      <div className='newItem'>
        <input
          onKeyDown={keydownCreate}
          onChange={e => setInputText(e.target.value)}
          value={inputText}
          placeholder="what needs to be done?" />
      </div>
      {todo?.items()?.map((item, i) => {
        return <TodoItem
          onStatus={(s) => {
            todo.items(d => {
              d[i].status = s
            })
          }}
          onRemove={() => {
            todo.items(d => {
              d.splice(i, 1)
            })            
          }}
          key={item.id}
          description={item.description}
          status={item.status} />
      })}
      {undoneItemsNum !== undefined ? (
        <div className='footer'>
          <span className='leftItems'>
            {undoneItemsNum} item left
          </span>
        </div>
      ) : ''}
    </div>
  )
}

document.title = 'Todos'

export default Todos