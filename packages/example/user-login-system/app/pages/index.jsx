import Index, { hooks } from '../../views/login'

export const meta = () => ({
  title: '测试登录页面'
})

document.title = 'Welcome!'

export default () => {

  return (
    <Index />
  )
}
