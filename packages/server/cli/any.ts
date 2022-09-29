import {
  readConfig,
  driversType,
  composeSchema,
  buildModelIndexes,
  buildViews,
} from "../src/"

export default async (cwd: string) => {

  const config = await readConfig({
    cwd,
  })


  await buildViews(config)  
}