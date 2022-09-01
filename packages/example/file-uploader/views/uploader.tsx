import { useTarat } from 'tarat-connect'
import React, { useState } from 'react'

const Uploader = () => {

  return (
    <div>
      <input type="file" defaultValue="" onChange={e => {
        // console.log('e: ', e.target.value, typeof e.target.value);
        // console.log('e: ', e.target.files, typeof e.target.files[0], e.target.files[0] instanceof File);
        const fd = new FormData()
        fd.append('myFile', e.target.files[0])
        fd.append('fileName', e.target.files[0].name)
        fetch('/', {
          method: 'POST',
          body: fd
        })
      }} />
    </div>
  )
}

export default Uploader