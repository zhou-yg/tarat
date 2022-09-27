import {
  readConfig,
  driversType,
  composeSchema,
  buildModelIndexes,
} from "../src/"

export default async (cwd: string) => {

  const config = await readConfig({
    cwd,
  })


  await composeSchema(config)
  
  await buildModelIndexes(config)
}