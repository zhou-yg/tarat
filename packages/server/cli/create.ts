import { writeFileSync } from 'node:fs';
import * as http from 'node:https'

const taratTemplatesZipURL = 'https://codeload.github.com/zhou-yg/tarat-templates/zip/refs/heads/master'

const cacheZip = 'tarat-templates.zip'

async function downloadZip () {
  http.get(taratTemplatesZipURL, res => {
    const { statusCode } = res
    if (statusCode !== 200) {
      console.error(`Request failed: ${statusCode}`);
      res.resume();
      return;
    }
    let buffers: Buffer[] = []
    let size = 0
    res.on('data', (chunk: Buffer) => {
      buffers.push(chunk)
      size += chunk.length
    })
    res.on('end', () => {
      const result = Buffer.concat(buffers, size)
      writeFileSync(cacheZip, result)
    })
  })
}

export default async (cwd: string, options: { useTs: boolean }) => {

  downloadZip()
}