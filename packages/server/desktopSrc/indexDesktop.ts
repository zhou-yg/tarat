import { spawn } from 'child_process'
import * as desktop from './desktop'
import { IConfig } from '../src'


export async function createDevClient (c: IConfig) {
  spawn('electron', [''])
}
