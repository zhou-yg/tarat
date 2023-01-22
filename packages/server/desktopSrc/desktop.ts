/**
 * run in electron runtime
 */
import electron from 'electron'
import { IConfig } from '../src/config';
import { connectModel } from '../src/util';

const { app, BrowserWindow } = electron
console.log('electron: ', electron);
console.log('electron.app: ', electron.app);

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  })
  mainWindow.loadURL('https://baidu.com')
}

function setupClient (c: IConfig) {

  const client = connectModel()

  client.use(async (ctx, next) => {
    console.log('app: ', app);
    await app.whenReady()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
    await next()
  })


  return client
}

export function createClient (c: IConfig) {
  
}

export async function createDevClient (c: IConfig) {
  const client = setupClient(c)
  client.start()
}

const isDev = process.env.RUN_MODE === 'development'

if (isDev) {
}
