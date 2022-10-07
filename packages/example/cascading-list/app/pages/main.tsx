import React, { useState } from 'react'
import { useTarat } from 'tarat/connect'
import Cascading from '../../views/cascading'
import cascadingHook, { Folder } from '@/drivers/cascading'

export default function Main () {
  const cascading = useTarat(cascadingHook)

  return (
    <div>
      <Cascading {...cascading} />
    </div>
  )
}