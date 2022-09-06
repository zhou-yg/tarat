import {
  readConfig,
  driversType,
} from "../src/"

export default async (cwd: string) => {

  const config = await readConfig({
    cwd,
  })
}