import { get, set } from 'tarat-core'
import Application from 'koa'
import { BINARY_FILE_KEY_SPLIT_CHAR, BINARY_FILE_TYPE_PLACEHOLDER } from 'tarat-connect'
function hasAnyFiles (req: Application.ExtendableContext['request'] & { body: any, files: any }) {
  return req.files && Object.keys(req.files).length > 0
}

export interface PersistentFile {
  lastModifiedDate: Date,
  filepath: string,
  newFilename: string,
  originalFilename: string,
  mimetype: 'application/octet-stream',
  hashAlgorithm: boolean,
  size: number,
}

export class SimulateBrowserFile implements PersistentFile {
  lastModifiedDate: Date
  filepath: string
  newFilename: string
  originalFilename: string
  mimetype: 'application/octet-stream'
  hashAlgorithm: boolean
  size: number
  name: string
  constructor(f: PersistentFile) {
    Object.assign(this, f)
    this.name = f.originalFilename
  }
}


export function unserializeObjToJSON (obj: Record<string, any>) {
  Object.entries(obj).forEach(([k, v]) => {
    if (v instanceof SimulateBrowserFile) {
      const kArr = k.split(BINARY_FILE_KEY_SPLIT_CHAR)
      const v = get(obj, kArr)
      if (v === BINARY_FILE_TYPE_PLACEHOLDER) {
        set(obj, kArr, v)
        delete obj[k]
      }
    }
  })
}

export function unserialize (): Application.Middleware {
  return async (ctx, next) => {
    const valid = hasAnyFiles(ctx.request as any)
    if (valid) {
      const { body, files } = ctx.request as any
      Object.entries(files).forEach(([k, v]: [string, PersistentFile]) => {
        body[k] = new SimulateBrowserFile(v)
      })
      
      const newBody = unserializeObjToJSON(body);
      (ctx.request as any).body = newBody
    }
    await next()
  }
}
