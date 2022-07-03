import React, { createContext } from 'react'
import Index from './pages/index.jsx'

export default (pageName, dc) => {



  return pageName === 'index' ? <Index /> : ''
}
