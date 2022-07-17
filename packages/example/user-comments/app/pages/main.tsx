import mainHook from '../../hooks/main'
import React from 'react'
import { useTarat } from 'tarat-connect'
import Todos from '../../views/todos'

export default function Main () {

  const main = useTarat(mainHook)

  return (
    <div>

      <p>
        alreadyLogin: {main.alreadyLogin()}
      </p>

      <Todos />
    </div>
  )
}
