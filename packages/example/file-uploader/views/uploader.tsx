import { useTarat } from 'tarat-connect'
import React, { useState } from 'react'
import uploaderHook from '@/drivers/uploader'

const Uploader = () => {

  const uploader = useTarat(uploaderHook)

  const f = uploader.inputFile()
  const OSSLink = uploader.OSSLink()

  return (
    <div>
      <p>
      {f && OSSLink ? <a href={OSSLink} >{f.name}</a> : ''}
      </p>
      <br/ >
      <input type="file" defaultValue="" onChange={e => {
        const f = e.target.files[0]
        console.log('f: ', f);
        uploader.inputFile(() => f)
      }} />
    </div>
  )
}

export default Uploader