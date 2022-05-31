import {
  createElement,
  atom,
  render
} from 'axii'


import hook from '../hooks/hook'
import useHook from '../connect/useAxiiHook'

function Plus () {

  const r = useHook(hook)
  
  const v1  = r.s1
  const v2  = r.s2

  function plus () {
    r.add(1)
  }

  function plusV2 {
    v2.value++
  }

  return (
    <plus block block-padding={8}>
      <div block block-padding={8}>      
        v1.num:{() => v1.num}
      </div>
      <div block block-padding={8}>      
        v2:{() => v2.value}
      </div>
      <div block block-padding={8}>
        <button onClick={plus}>all plus 1</button>
        <button block onClick={plusV2}>plus v2</button>
      </div>
    </plus>
  )
}


render(
  <Plus />,
  document.getElementById('app')
)
