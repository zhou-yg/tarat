import { IHookContext, isState, Runner, setModelConfig } from '@tarot-run/core'
import hook from '../hooks/hook'
import { useEffect, useState } from 'react'
import { cloneDeep } from 'lodash'

const hostConfig = `http://localhost:9001/_hook`

/**
 * @TODO should provide by @tarot-run by default
 */
setModelConfig({
  async find(e, w) {
    return []
  },
  async update(e, w) {
    return []
  },
  async remove(e, d) {
    return []
  },
  async create(e, d) {
    return {}
  },
  async executeDiff(d) {},
  async postDiffToServer(d) {},
  async postComputeToServer(c) {

    const newContext: IHookContext = await fetch(hostConfig, {
      method: 'POST',
      body: JSON.stringify(c)
    }).then(r => r.json())

    return newContext
  },
})

/**
 * @TODO should provide by @tarot-run by default
 */
export default (...args: any[]) => {

  const [hookResult, setHookResult] = useState<null | { [k: string]: any }>(null)

  useEffect(() => {
    const runner = new Runner(hook)
    console.log('runner: ', runner);
    const r = runner.init(...args)
  
    runner.onUpdate(() => {
      console.log('hook changed', runner.scope)
      mapStateToReactive()
    })
    
    function mapStateToReactive () {
      setHookResult({...r})
    }
    mapStateToReactive()
  }, [])

  return hookResult
}