import React, { createContext } from 'react'
import Index from './pages/index.jsx'

export default (doc) => {
  return (
    <div id="server-side-render">
      {doc}
    </div>
  )
}
