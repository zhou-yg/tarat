import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import MD from './static-deps/markdown-it.mjs'
import ejs from './static-deps/ejs.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const enDocDir = path.join(__dirname, '../doc/en/')
const indexHTMLTemplate = fs.readFileSync(path.join(__dirname, './static-deps/index.ejs')).toString()
const articleHTMLTemplate = fs.readFileSync(path.join(__dirname, './static-deps/article.ejs')).toString()

const targetIndexHTML = path.join(__dirname, '../index.html')

const mdIt = new MD()

const example = path.join(enDocDir, 'Getting Started/introdution.md')

const basicTag = '---'

function pickBasicInfo (filePath) {
  const mdStr = fs.readFileSync(filePath).toString()
  const lines = mdStr.trim().split('\n')

  const basicMap = {}
  let newStartIndex = 0;

  if (lines[0] === basicTag) {
    const secondTagIndex = lines.slice(1).indexOf(basicTag)
    if (secondTagIndex > -1) {
      const basicLines = lines.slice(1, secondTagIndex + 1)
      basicLines.forEach(basicPropLine => {
        if (basicPropLine) {
          const [prop, value] = basicPropLine.split(':').filter(Boolean)
          basicMap[prop] = (value).trim()
        }
      })
      newStartIndex = secondTagIndex + 1 + 1
    }
  }

  return {
    basic: basicMap,
    lines: lines.slice(newStartIndex)
  }
}

function renderToArticle (info) {
  const originMdContent = info.lines.join('\n')
  const md = mdIt.render(originMdContent)

  const html = ejs.render(articleHTMLTemplate, {
    hash: info.basic.title,
    md,
  })

  return html
}

const fileTree = []

function generateFile (p, f2) {
  const p2 = path.join(p, f2)
  const r = pickBasicInfo(p2)
  const title = f2.replace(/\.md$/, '')
  if (!r.basic.title) {
    r.basic.title = title
  }
  const article = renderToArticle(r)

  return {
    file: f2,
    ...r.basic,
    html: article
  }
}

// 2 level directory
fs.readdirSync(enDocDir).forEach((file) => {
  const p = path.join(enDocDir, file)
  if (fs.lstatSync(p).isDirectory()) {
    const directoryObj = {
      title: file,
      children: []
    }
    fileTree.push(directoryObj)
    fs.readdirSync(p).forEach(f2 => {
      const r = generateFile(p, f2)
      if (f2 === 'index.md') {
        Object.assign(directoryObj, { order: r.order })
      } else {
        directoryObj.children.push(r)
      }
    })
  } else {  
    const r = generateFile(enDocDir, file)
    fileTree.push(r)
  }
})

function sortByOrder (arr) {
  const newArr = arr.slice().sort((p, n) => {
    if (!Reflect.has(p, 'order')) {
      return 1
    }
    if (!Reflect.has(n, 'order')) {
      return -1
    }
    return parseInt(p.order) - parseInt(n.order)
  })

  return newArr
}

const sortedFileTree = sortByOrder(fileTree)

const htmls = sortedFileTree.map(file => {
  if (file.children?.length) {
    return file.children.map(c => c.html)
  } else {
    return file.html
  }
}).flat().join('\n')

const aside = sortedFileTree.map(file => {
  if (file.children?.length > 0) {
    return [
      `<div class="group-title" >${file.title}</div>`,
      ...file.children.map(child => {
        return `<div class="child-title" ><a href="#${child.title}" >${child.title}</a></div>`
      }),
    ]
  } else {
    return `<div class="group-title" ><a href="#${file.title}">${file.title}</a></div>`
  }
}).flat().join('\n')

const finalHTML = ejs.render(indexHTMLTemplate, {
  htmls: htmls,
  aside,
})

fs.writeFileSync(targetIndexHTML, (finalHTML))
