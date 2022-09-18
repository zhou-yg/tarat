import {
  Hook,
  isState,
  Runner,
  State,
  Watcher,
  IDataPatch,
  applyPatchesToObject,
  BM,
  cloneDeep,
  deleteKey,
  isFunc,
  isPrimtive,
  set
} from 'tarat/core'

class AxiiData {
  watcher: Watcher<Hook> = new Watcher(this)
  constructor(public callback: (hook?: Hook, patches?: IDataPatch[]) => void) {}
  notify(hook?: Hook, patches?: IDataPatch[]) {
    this.callback(hook, patches)
  }
}

export function useAxiiHook<T extends BM>(axii: any, hook: T, ...args: any) {
  // @ts-ignore
  const { atom, reactive } = axii

  const runner = new Runner(hook)
  const r = runner.init(...args)

  const response: any = {}

  function mapStateToReactive() {
    Object.keys(r).forEach(k => {
      if (isState(r[k])) {
        const valueGetter = r[k]
        const v = valueGetter()

        const primitive = isPrimtive(v)
        const reactiveObj = primitive ? atom(v) : reactive(cloneDeep(v))
        response[k] = (param?: Function) => {
          if (param && isFunc(param)) {
            const [_, patches] = valueGetter(param)
            if (primitive) {
              patches.forEach((p: IDataPatch) => {
                reactiveObj.value = p.value
              })
            } else {
              applyPatchesToObject(reactiveObj, patches)
            }
          }
          return reactiveObj
        }
        const data = new AxiiData((_, patches) => {
          if (primitive) {
            reactiveObj.value = valueGetter()
          } else {
            if (patches) {
              applyPatchesToObject(reactiveObj, patches)
            } else {
              Object.assign(reactiveObj, valueGetter())
            }
          }
        })
        data.watcher.addDep(valueGetter._hook)
      } else if (!response[k]) {
        response[k] = r[k]
      }
    })
  }
  mapStateToReactive()

  return response
}
