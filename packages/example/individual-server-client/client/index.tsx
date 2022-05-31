import {
  createElement,
  atom,
  render
} from 'axii'


import useTarot from '../connect/useAxiiHook'

function Plus () {

  const r = useTarot()
  
  const v1  = r.s1
  const v2  = r.s2


  function plus () {
    r.add(1)
  }

  return (
    <plus block block-padding={8}>
      <div block block-padding={8}>      
        v1:{() => v1.num}
      </div>
      <div block block-padding={8}>      
        v2:{() => v2.value}
      </div>
      <div block block-padding={8}>
        <button onClick={plus}>all plus 1</button>
        <button block onClick={() => {
          v2.value++
        }}>add v2</button>
      </div>
    </plus>
  )
}


render(
  <Plus />,
  document.getElementById('app')
)
