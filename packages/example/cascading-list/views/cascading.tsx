import { useTarat } from 'tarat-connect'
import React, { useEffect, useState } from 'react'
import PlusSquareOutlined from '@ant-design/icons/PlusSquareOutlined'
import FolderOutlined from '@ant-design/icons/FolderOutlined'
import cascadingHook from '../drivers/cascading'

const Files: React.FC<{}> = () => {
  const cascading = useTarat(cascadingHook)

  return (
    <div className="px-2">
      <button
        onClick={() => {
          cascading.createItem()
        }}
        className="block text-xs text-slate-600 px-2 border-x border-y">
        新建
      </button>
      {cascading.items().map(item => {
        return (
          <div key={item.id} className="m-2">
            {item.name}
          </div>
        )
      })}
    </div>
  )
}

const Cascading: React.FC<{
  title?: string
}> = (props) => {
  const { title = '我的文件夹' } = props

  const cascading = useTarat(cascadingHook)

  const cfid = cascading.currentFolderId()

  useEffect(() => {
    function fn () {
      cascading.currentFolderId(() => null)
    }
    document.addEventListener('click', fn)
    return () => {
      document.removeEventListener('click', fn)
    }
  }, [])

  return (
    <div className="p-2  text-black flex">
      <div className="p-2 bg-slate-200 flex-1">
        <header className="text-sm">
          {title}
        </header>
        <div className="my-2">
          <ul>
            {cascading.folders().map(folder => {
              const current = folder.id === cfid
              const cls = current ? 'bg-black text-white p-2' : 'mx-2 my-1'
              return (
                <li key={folder.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    cascading.currentFolderId(() => folder.id)
                  }}
                  className={`cursor-pointer flex items-center ${cls}`}>
                  <FolderOutlined /> <span className='ml-1'>{folder.name}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <button
          onClick={() => {
            cascading.createFolder()
          }}
          className="flex items-center text-sm text-slate-600">
          <PlusSquareOutlined /> <span className='ml-1'>新建文件夹</span>
        </button>
      </div>
      <div className="flex-1">
        {cascading.currentFolderId() ? <Files /> : ''}
      </div>
    </div>
  )
}

export default Cascading