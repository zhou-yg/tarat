import {
  computed,
  state,
  computedInServer,
  prisma,
  writePrisma,
} from 'tarat-core'
import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'
import * as indexes from '@/models/indexes'

export default function uploader<T> () {
  // only in browser
  const inputFile = state<{
    name: string, filepath?: string, newFilename?: string, originalFilename?: string
    _writeStream: WritableStream
  }>()

  // save in local
  const OSSLink = computedInServer(function * () {
    const file = inputFile()
    if (file) {
      const publicDir = path.join(process.cwd(), 'public')
      const destFile = path.join(publicDir, file.originalFilename)
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir)
      }
      yield new Promise(resolve => {
        fs.createReadStream(file.filepath)
          .pipe(fs.createWriteStream(destFile))
          .on('close', () => resolve(0))
          .on('error', () => { throw new Error('copy file to public dir fail') })
      })
      return {
        name: file.newFilename,
        link: `/${file.originalFilename}`
      }
    }
  })

  const fileStorage = prisma<{ name: string; link: string }[]>(indexes.StorageItem)
  const writeFileStroage = writePrisma(fileStorage, () => ({
    ...(OSSLink() || {}),
  }))

  const createStorage = computedInServer(function * () {
    yield writeFileStroage.create()
  })
  
  return {
    createStorage,
    inputFile,
    OSSLink
  }
}