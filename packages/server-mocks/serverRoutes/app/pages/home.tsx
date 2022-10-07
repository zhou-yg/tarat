import React, { useState } from 'react'
import { useTarat } from 'tarat/connect'
import a from '../../drivers/a'

export default function Main () {
  const aHook = useTarat(a)

  return (
    <div>
      home {aHook.s1()}
    </div>
  )
}