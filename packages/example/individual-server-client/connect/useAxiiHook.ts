import { IHookContext, isState, Runner, setModelConfig } from '@tarot-run/core'
import hook from '../server/hook'
import {
  atom, reactive, watch, traverse, isReactive, isAtom
} from 'axii'
import { cloneDeep } from 'lodash'

const hostConfig = `http://localhost:9001/hook`

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

export default (...args: any[]) => {
  const runner = new Runner(hook)
  console.log('runner: ', runner);
  const r = runner.init(...args)

  runner.onUpdate(() => {
    console.log('hook changed', runner.scope)
    mapStateToReactive()
  })

  const response:  any = {}

  function mapStateToReactive () {
    Object.keys(r).forEach(k => {
      if (isState(r[k])) {
        const v = (r[k]())

        if (response[k]) {
          const a = response[k]
          if (isReactive(a)) {
            Object.assign(a, v)
          } else if (isAtom(a)) {
            a.value = v
          }
        } else {
          const a = typeof v === 'object' ? reactive(cloneDeep(v)) : atom(v)
          response[k] = a
    
          watch(() => traverse(a), () => {
            setTimeout(() => {
              r[k]((d: any) => {
                if (typeof v === 'object') {
                  Object.assign(d, a)
                } else {
                  return a.value
                }
              })    
            }, 10)
          })
        }
      } else if (!response[k]) {
        response[k] = r[k]
      }
    })
  }
  mapStateToReactive()

  return response
}