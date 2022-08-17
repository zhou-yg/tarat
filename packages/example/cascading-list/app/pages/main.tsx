import React, { useState } from 'react'

import Cascading from '../../views/cascading'

export default function Main () {
  const [s, setS] = useState('')
  return (
    <div>
      <input
        className="border-x border-y p-2 m-2"
        value={s} onChange={e => setS(e.target.value)} />
      <Cascading />
    </div>
  )
}