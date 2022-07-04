import { readConfig } from "../src/config";
import { createDevServer } from "../src/server";

export default async (cwd: string) => {
  const config = await readConfig({
    cwd,
  })
  
  // const fs = require('fs')
  // console.log('fs: ', fs);

  createDevServer(config)
}
