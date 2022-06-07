/** @jsx createElement */
import {
  createElement,
  atom,
  render
} from 'axii'

import hook from '../hooks/hook.js'
import { useHook } from '@tarot-run/core'
import clientRuntime from '@tarot-run/server/dist/adaptors/runtime-helper/clientRuntime'
import * as axii from 'axii'

clientRuntime({
  collection: axii,
  name: 'axii',
  host: 'http://localhost:9001/'
});

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
