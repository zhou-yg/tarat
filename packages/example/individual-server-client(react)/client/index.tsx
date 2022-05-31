import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'

import hook from '../hooks/hook'
import useHook from '../connect/useReactHook'

const Plus: React.FC = () => {

  const r = useHook(hook)
  
  const v1  = r?.s1()
  const v2  = r?.s2()

  function plus () {
    r.add(1)
  }
  function plusV2 () {
    r.s2?.((v: number) => v + 1)
  }

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ padding: '8px' }}>      
        v1.num：{v1?.num}
      </div>
      <div style={{ padding: '8px' }}>      
        v2：{v2}
      </div>
      <div style={{ padding: '8px' }}>
        <button onClick={plus}>all plus 1</button>
        <br/>
        <button onClick={plusV2}>plus v2 1</button>
      </div>
    </div>
  )
}


const container = createRoot(document.getElementById('app'))
container.render(
  <Plus key="p" />
)
