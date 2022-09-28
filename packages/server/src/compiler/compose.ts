import { IConfig } from "../config";
import * as fs from 'fs'
import * as path from 'path'
import { equalFileContent, loadJSON } from "../util";
import * as prismaInternals from '@prisma/internals'
import os from 'os'
import { cp } from "shelljs";
import { camelCase } from 'camel-case'
import { autoGeneratedTip } from "./constants";
import { upperFirst } from "lodash";

interface IEnhancement {
  extraRelation: {
    from: {
      model: string
      field: string
    },
    type: '1:1' | '1:n' | 'n:1' | 'n:n'
    to: {
      model: string
      field: string
    }
  }[]
  modelAddition: {
    name: string,
    fields: {
      name: string
      type: string
      extra: string
    }[]
  }[]
}

interface IPrismaFile {
  moduleName?: string;
  path: string;
  content: string
}

export function findDependentPrisma (c: IConfig) {
  const schemaFiles: Array<IPrismaFile> = []

  c.dependencyModules.forEach(moduleName => {
    const dir = path.join(c.cwd, 'node_modules', moduleName)

    const depSchemaPath = path.join(dir, c.buildDirectory, c.modelsDirectory, 'schema.prisma')
    const r2 = fs.existsSync(depSchemaPath)

    if (r2) {
      schemaFiles.push({
        moduleName,
        path: depSchemaPath,
        content: fs.readFileSync(depSchemaPath).toString()
      })
    }
  })

  return schemaFiles
}

interface IParsedSchemaStruct {
  name: string
  fieldLines: string[]
}

function pickExpectModel (schemaContents: IPrismaFile[]) {
  const contents = schemaContents.map(({content}) => {
    return content.replace(/model \w+ {[\w\W\n]*?}/g, '')
  })

  return contents
}

function lowerFirst (str: string) {
  return str ? str[0].toLowerCase() + str.substring(1) : str
}

function getSourceReferrenceType (source: IParsedSchemaStruct, targetProp: string) {
  let type = ''
  source.fieldLines.forEach(line => {
    const row = line.split(' ').filter(Boolean).map(s => s.trim())
    
    if (!type && row[0] === targetProp) {
      type = row[1]
    }
  })

  if (!type) {
    throw new Error(`[getSourceReferrenceType] can not find ${targetProp} in source(name=${source.name})`)
  }

  return type
}

export function transformModelName(str: string) {
  return str.replace(/\/|@|-/g, '_')
}

async function generateNewSchema (c: IConfig, schemaContentArr: IPrismaFile[], enhanceJSON?: IEnhancement) {
  const schemaStructArr = await Promise.all(schemaContentArr.map(async prismaFile => {
    const { moduleName, content: schemaContent } = prismaFile

    const model = await prismaInternals.getDMMF({
      datamodel: schemaContent
    })
    const models = model.datamodel.models
    
    const modelsStruct = models.map((n: any) => {
      const { name } = n
      const r = schemaContent.match(new RegExp(`model ${name} {[\\w\\W\\n]*?}`, 'g'))
      const nameWithModulePrefix = moduleName ? upperFirst(transformModelName(`${moduleName}_${name}`)) : name
      const fieldLines = r?.[0]?.split('\n').slice(1, -1) || []

      const newFieldLines = fieldLines.map(line => {
        const [columnName, columnType, ...rest] = line.trim().split(/\s+/)
        if (columnType) {
          // pick model type that having the highest match rate
          const [selfCustomModel] = models.filter(m => new RegExp(`^${m.name}`).test(columnType)).sort((p, n) => p.name.length - n.name.length)
          if (selfCustomModel) {
            const columnTypePostfix = columnType.replace(new RegExp(`^${selfCustomModel.name}`), '')
            return [
              columnName,
              upperFirst(transformModelName(`${moduleName}_${selfCustomModel.name}`)) + columnTypePostfix,
              ...rest
            ].join(' ')
          }
        }
        return line
      })

      return {
        name: nameWithModulePrefix,
        originalName: name,
        fieldLines: newFieldLines,
      }
    })
    
    return modelsStruct
  }))
  const schemaStructArrFlat:IParsedSchemaStruct[] = schemaStructArr.flat()

  const manyToManyCenteralModels: IParsedSchemaStruct[] = []

  if (enhanceJSON) {
    enhanceJSON.extraRelation?.forEach(relation => {
      const fromModel = transformModelName(relation.from.model)
      const toModel = transformModelName(relation.to.model)

      const source = schemaStructArrFlat.find(t => t.name === fromModel)
      const target = schemaStructArrFlat.find(t => t.name === toModel)

      if (!source || !target) {
        throw new Error(`[generateNewSchema] ${!!source} ${!!target} cannot found the source (name=${fromModel}) or target (name=${toModel}) `)
      }

      // prisma doc:https://www.prisma.io/docs/concepts/components/prisma-schema/relations/one-to-one-relations
      switch (relation.type) {
        case '1:1':
          {
            source.fieldLines.push(`${relation.from.field} ${target.name}?`)

            const type = getSourceReferrenceType(source, 'id')
            target.fieldLines.push(`${lowerFirst(source.name)} ${source.name} @relation(fields: [${relation.to.field}], references:[id])`)
            target.fieldLines.push(`${relation.to.field} ${type} @unique`)
          }
          break
        case '1:n':
          {
            source.fieldLines.push(`${relation.from.field} ${target.name}[]`)
            target.fieldLines.push(`${lowerFirst(source.name)} ${source.name} @relation(fields: [${relation.to.field}], references:[id])`)
            const type = getSourceReferrenceType(source, 'id')
            target.fieldLines.push(`${relation.to.field} ${type}`)
          }
          break
        case 'n:1':
          {
            const type = getSourceReferrenceType(source, 'id')
            source.fieldLines.push(`${lowerFirst(target.name)} ${target.name} @relation(fields: [${relation.from.field}], references:[id])`)
            source.fieldLines.push(`${relation.from.field} ${type}`)
            target.fieldLines.push(`${relation.to.field} ${source.name}[]`)
          }
          break
        case 'n:n':
          {
            const centeralModelName = `Many${source.name}ToMany${target.name}`
            const sourceReferType = getSourceReferrenceType(source, 'id')
            const targetReferType = getSourceReferrenceType(target, 'id')

            const m2mModel = {
              name: centeralModelName,
              fieldLines: [
                `${lowerFirst(source.name)} ${source.name} @relation(fields: [${relation.from.field}], references: [id])`,
                `${relation.from.field} ${sourceReferType}`,
                `${lowerFirst(target.name)} ${target.name} @relation(fields: [${relation.to.field}], references: [id])`,
                `${relation.to.field} ${targetReferType}`,
                `@@id([${relation.from.field}, ${relation.to.field}])`
              ]
            }
            manyToManyCenteralModels.push(m2mModel)

            source.fieldLines.push(`${relation.from.field} ${m2mModel.name}[]`)
            target.fieldLines.push(`${relation.to.field} ${m2mModel.name}[]`)
          }
          break
        default:
          const text = relation.type ? `[generateNewSchema] unexpected relation type "${relation.type}"` : `[generateNewSchema] must specific a relation type in [ 1:1, 1:n, n:1, n:n]`
          throw new Error(text)
      }
    })
  }

  const newSchemaContent = schemaStructArrFlat.concat(manyToManyCenteralModels).map(m => {
    return [
      `model ${m.name} {`,
      ...m.fieldLines,
      '}'
    ].join('\n')
  }).join('\n')

  return newSchemaContent
}

/**
 * read all exist partial schema, return all files content
 */
export function readExsitPrismaPart (c: IConfig) {
  const modelsDir = path.join(c.cwd, c.modelsDirectory)
  const existPrismaParts: IPrismaFile[] = []
  fs.readdirSync(modelsDir).forEach(file => {
    if (new RegExp(`${c.prismaModelPart}$`).test(file)) {
      const schema = fs.readFileSync(path.join(modelsDir, file)).toString()
      existPrismaParts.push({
        moduleName: '',
        path: path.join(modelsDir, file),
        content: schema
      })
    }
  })

  return existPrismaParts
}
export function readCurrentPrisma (c: IConfig): IPrismaFile {
  const file = path.join(c.cwd, c.modelsDirectory, c.targetSchemaPrisma)

  return {
    path: file,
    content: fs.readFileSync(file).toString()
  }
}


async function generateSchemaFile (file: string, str: string[]) {
  const lines = autoGeneratedTip().concat(str).join('\n')

  const formatResult = await prismaInternals.formatSchema({ schema: lines })

  fs.writeFileSync(file, formatResult?.trimEnd() + os.EOL)
}

export async function composeSchema (c: IConfig) {
  const { modelEnhanceFile: enhanceFile, modelTargetFile: targetFile } = c.pointFiles
  
  let enhanceJSON: IEnhancement | undefined
  if (fs.existsSync(enhanceFile)) {
    enhanceJSON = loadJSON(enhanceFile)
  }
  if (c.model.engine === 'prisma') {
    const taratPrismas = findDependentPrisma(c)

    const partSchema = path.join(c.cwd, c.modelsDirectory, `schema.${c.prismaModelPart}`)
    if (!fs.existsSync(partSchema) && taratPrismas.length > 0) {
      cp(targetFile, partSchema)
    }

    const existPrismaPart = readExsitPrismaPart(c)

    /**
     * if detect the dependent prisma, must backup orignal schema.prisma
     */
    if (taratPrismas.length > 0) {
      const newSchemaContent = await generateNewSchema(
        c,
        existPrismaPart.concat(taratPrismas),
        enhanceJSON
      )
  
      const existPrismaPartWithoutModels = pickExpectModel(existPrismaPart)
      
      await generateSchemaFile(
        targetFile,
        [
          '// original writing schema',
          ...existPrismaPartWithoutModels,
          '// auto composing schema ',
          newSchemaContent,
        ]
      )
    }
  }
}

interface IDependencyHook {
  name: string
  modulePath: string
}
const referrenceHookTemp = (arg: { path: string }) => `
${autoGeneratedTip().join('\n')}
export { default } from '${arg.path}'
`
async function generateReferrenceDrivers (c: IConfig, h: IDependencyHook[]) {
  const curDriversDir = path.join(c.cwd, c.driversDirectory, c.composeDriversDirectory)

  if (!fs.existsSync(curDriversDir) && h.length > 0) {
    fs.mkdirSync(curDriversDir)
  }

  await Promise.all(h.map(obj => new Promise<void>((res, rej) => {
    const code = referrenceHookTemp({ path: obj.modulePath })
    const f = path.join(curDriversDir, `${obj.name}${c.ts ? '.ts' : '.js'}`)

    if (fs.existsSync(f)) {
      const existCode = fs.readFileSync(f).toString()
      if (equalFileContent(code, existCode)) {
        return res()
      }
    }
    
    fs.writeFile(f, code, (err) => {
      if (err) {
        rej(err)
      } else {
        res()
      }
    })
    // fs.writeFileSync(f, code)
  })))
}

export async function composeDriver(c: IConfig) {
  const dependencyDrivers: IDependencyHook[] = []
  
  c.dependencyModules.forEach(moduleName => {
    const dir = path.join(c.cwd, 'node_modules', moduleName)
    const distDriversDir = path.join(dir, c.buildDirectory, c.driversDirectory)
    if (!fs.existsSync(distDriversDir)) {
      console.error(`[composeDriver] hasnt drivers in "${moduleName}/${c.buildDirectory}/${c.driversDirectory}"`)
      return
    }

    fs.readdirSync(distDriversDir)
      .filter(f => /\.js$/.test(f) && !/deps\.js$/.test(f))
      .forEach(f => {
        const { name } = path.parse(f)
        let driverName = name
        if (dependencyDrivers.find(v => v.name === driverName)) {
          driverName = camelCase(`${moduleName}.${name}`)
          if (dependencyDrivers.find(v => v.name === driverName)) {
            throw new Error('[tarat] can not handle hook name confict betwwen all dependency modules')
          }
        }
        dependencyDrivers.push({
          name: driverName,
          modulePath: `${moduleName}/${c.buildDirectory}/${c.driversDirectory}/${name}`
        })
      })
  })
  await generateReferrenceDrivers(c, dependencyDrivers)
}
