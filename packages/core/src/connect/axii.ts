import { IPatch, applyPatchesToObject } from '../util';
import { Hook, isState, Runner, State, Watcher } from '../core'
import { cloneDeep, deleteKey, isFunc, isPrimtive, set } from '../util';

class AxiiData {
  watcher: Watcher<Hook> = new Watcher(this)
  constructor (
    public callback: (hook?: Hook, patches?: IPatch[]) => void
  ) {}
  notify (hook?: Hook, patches?: IPatch[]) {
    this.callback(hook, patches)
  }
}
/**
 * @TODO should provide by @tarot-run by default
 */
export function useAxiiHook (axii: any, hook: () => void, ...args: any[]) {
  // @ts-ignore
  const {
    atom, reactive, watch, traverse, isReactive, isAtom
  } = axii;

  const runner = new Runner(hook)
  const r = runner.init(...args)

  const response:  any = {}

  function mapStateToReactive () {
    Object.keys(r).forEach(k => {
      if (isState(r[k])) {
        const stateHook = r[k]
        console.log('stateHook: ', stateHook);
        const v = (stateHook())

        const primitive = isPrimtive(v)
        const reactiveObj = primitive ?  atom(v) : reactive(cloneDeep(v))
        response[k] = (param?: Function) => {
          if (param && isFunc(param)) {
            const [newResult, patches] = stateHook(param)
            if (primitive) {
              patches.forEach((p: IPatch) => {
                reactiveObj.value = p.value
              })
            } else {
              applyPatchesToObject(reactiveObj, patches)
            }
          }
          return reactiveObj
        }
        const data = new AxiiData((hook, patches) => {
          if (primitive) {
            reactiveObj.value = stateHook()
          } else {
            if (patches) {
              applyPatchesToObject(reactiveObj, patches)
            } else {
              Object.assign(reactiveObj, stateHook())
            }
          }
        })
        data.watcher.addDep(stateHook._hook)
      } else if (!response[k]) {
        response[k] = r[k]
      }
    })
  }
  mapStateToReactive()

  return response
}