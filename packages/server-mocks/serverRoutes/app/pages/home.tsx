import React, { useState } from 'react'
import { useSignal } from '@polymita/connect/react'
import a from '../../drivers/a'

export default function Main () {
  const aHook = useSignal(a)

  return (
    <div>
      home {aHook.s1()}
    </div>
  )
}