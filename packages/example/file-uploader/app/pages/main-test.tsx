import React, { useEffect, useRef } from 'react'

import Uploader from '@/views/uploader'

export default function Main () {
  const iframe = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iframe.current) {
      const d = document.createElement('div')
      d.draggable = true
      d.ondragover = (e) => {
        e.preventDefault()
      }
      d.ondrop = (e) => {
        console.log(e)
        const v = e.dataTransfer.getData('text')
        console.log('v: ', v);
        // d.appendChild(e.srcElement)
      }
      d.ondragstart = (e) => {
        e.dataTransfer.setData('text', '456')
      }
      Object.assign(d.style, {
        width: '100px',
        height: '100px',
        background: 'red'
      })
      iframe.current.contentDocument.body.appendChild(d)
      
    }
  }, [])

  return (
    <div>
      <Uploader />

      <div>
        <iframe ref={iframe} id="myIframe" src="" />
      </div>
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          console.log(e.target)
          console.log(e.dataTransfer.getData('text'))
        }}
        onDragStart={e => {
          e.dataTransfer.setData('text', '123')
          console.log(e)
        }}
        draggable className="bg-black" style={{ width: '150px', height: '150px' }}>

      </div>
    </div>
  )
}