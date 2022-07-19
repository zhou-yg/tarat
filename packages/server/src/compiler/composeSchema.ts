import { IConfig } from "../config";
import * as fs from 'fs'
import * as path from 'path'
import { loadJSON } from "../util";
import * as prismaInternals from '@prisma/internals'
import os from 'os'
import { cp } from "shelljs";

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

function findDependentPrisma (c: IConfig) {
  const schemaFiles: string[] = []

  c.dependencyModules.forEach(moduleName => {
    const dir = path.join(c.cwd, 'node_modules', moduleName)

    const depSchemaPath = path.join(dir, c.buildDirectory, c.modelsDirectory, 'schema.prisma')
    const r2 = fs.existsSync(depSchemaPath)

    if (r2) {
      schemaFiles.push(depSchemaPath)
    }
  })

  return schemaFiles.map(filePath => fs.readFileSync(filePath).toString())
}

interface IParsedSchemaStruct {
  name: string
  fieldLines: string[]
}

function pickExpectModel (schemaContents: string[]) {
  const contents = schemaContents.map(content => {
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

async function generateNewSchema (c: IConfig, schemaContentArr: string[], enhanceJSON?: IEnhancement) {
  const schemaStructArr = await Promise.all(schemaContentArr.map(async schemaContent => {
    const model = await prismaInternals.getDMMF({
      datamodel: schemaContent
    })
    const models = model.datamodel.models
    
    const modelsStruct = models.map((n: any) => {
      const { name } = n
      const r = schemaContent.match(new RegExp(`model ${name} {[\\w\\W\\n]*?}`, 'g'))
      return {
        name,
        fieldLines: r?.[0]?.split('\n').slice(1, -1) || []
      }
    })
    

    return modelsStruct
  }))
  const schemaStructArrFlat:IParsedSchemaStruct[] = schemaStructArr.flat()
  const manyToManyCenteralModels: IParsedSchemaStruct[] = []

  if (enhanceJSON) {
    enhanceJSON.extraRelation?.forEach(relation => {
      const source = schemaStructArrFlat.find(t => t.name === relation.from.model)
      const target = schemaStructArrFlat.find(t => t.name === relation.to.model)

      if (!source || !target) {
        throw new Error(`[generateNewSchema] cannot found the source (name=${relation.from.model}) or target (name=${relation.to.model})`)
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
            target.fieldLines.push(`${relation.to.field} ${type} @unique`)
          }
          break
        case 'n:1':
          {
            const type = getSourceReferrenceType(source, 'id')
            source.fieldLines.push(`${lowerFirst(target.name)} ${target.name} @relation(fields: [${relation.from.field}], references:[id])`)
            source.fieldLines.push(`${relation.from.field} ${type} @unique`)
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

function readExsitPrismaPart (c: IConfig) {
  const modelsDir = path.join(c.cwd, c.modelsDirectory)
  const existPrismaParts: string[] = []
  fs.readdirSync(modelsDir).forEach(file => {
    if (new RegExp(`${c.prismaModelPart}$`).test(file)) {
      const schema = fs.readFileSync(path.join(modelsDir, file)).toString()
      existPrismaParts.push(schema)
    }
  })

  return existPrismaParts
}

async function generateSchemaFile (file: string, str: string[]) {
  const lines = [
    '//',
    '// provide by @tarat',
    '// warning: auto generated by tarat.do not modifed this file',
    '//',
  ].concat(str).join('\n')

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
