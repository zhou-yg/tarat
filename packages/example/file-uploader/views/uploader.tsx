import { useTarat } from 'tarat-connect'
import React, { useState } from 'react'
import uploaderHook from '@/drivers/uploader'

const Uploader = () => {

  const uploader = useTarat(uploaderHook)

  const f = uploader.inputFile()

  return (
    <div>
      {f ? `name: ${f.name}` : ''} <br/>
      <input type="file" defaultValue="" onChange={e => {
        const f = e.target.files[0]
        console.log('f: ', f);
        uploader.inputFile(() => f)
      }} />
    </div>
  )
}

export default Uploader