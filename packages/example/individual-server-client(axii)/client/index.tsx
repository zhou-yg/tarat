/** @jsx createElement */
import {
  createElement,
  atom,
  render
} from 'axii'

import hook from '../hooks/hook.js'
import { setHookAdaptor,  useHook } from '@tarot-run/core'
import * as axii from 'axii'
import './clientRuntime'

setHookAdaptor(axii, 'axii');

function Plus () {

  const r = useHook(hook)

  const { s1, s2 } = r

  function plus () {
    r.add(1)
  }

  function plusV2 () {
    s2((v) => {
      return v + 1
    })
  }

  return (
    <plus block block-padding={8}>
      <row block block-padding={8}>      
        v1.num:{() => s1().num}
      </row>
      <row block block-padding={8}>      
        v2:{() => s2().value}
      </row>
      <row block block-padding={8}>
        <button onClick={plus}>all plus 1</button>
        <br/>
        <button onClick={plusV2}>plus v2</button>
      </row>
    </plus>
  )
}


render(
  <Plus />,
  document.getElementById('app')
)
