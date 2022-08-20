import React from 'react'
import Login from '../../views/login.jsx'

export const meta = () => ({
  title: '测试登录页面'
})

// document.title = 'Welcome!'

export default () => {

  return (
    <div className="w-full h-screen bg-slate-100 flex items-center justify-center">
      <Login title={
        <h2 className="text-xl">LOGIN EXAMPLE</h2>
      } type="login" />
    </div>
  )
}
