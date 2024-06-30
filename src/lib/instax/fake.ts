/* eslint-disable @typescript-eslint/no-unused-vars */
import { Buffer } from 'buffer'

import { delay } from '../utils'
import { InstaxBluetooth } from './bluetooth'
import { InstaxFilmVariant } from './types'

export class FakeInstaxPrinter extends InstaxBluetooth {
  constructor() {
    super()
  }

  private onDisconnect?: () => void

  public async setColor(
    colors: string[],
    speed = 20,
    repeat = 0,
    when = 0,
  ): Promise<void> {
    await delay(1000)
  }

  public async connect(onDisconnect: () => void) {
    const device = {
      name: 'FakePrinter',
    } as BluetoothDevice
    this.onDisconnect = onDisconnect
    return device
  }

  public async disconnect() {
    this.onDisconnect?.()
  }

  async getInformation(includeType = false) {
    const printerStatus = {
      battery: {
        charging: false,
        level: 45,
      },
      polaroidCount: 5,
      type: InstaxFilmVariant.WIDE,
      width: 1260,
      height: 840,
      waitTime: 15,
    }
    await delay(1000)
    return printerStatus
  }

  async printImage(): Promise<void> {
    await delay(1000)
  }

  async sendImage(
    imageData: Buffer,
    type: InstaxFilmVariant,
    enable3DLut: boolean,
    onProgress: (progress: number) => void,
    signal: AbortSignal,
  ): Promise<void> {
    let abortedPrinting = false
    signal.addEventListener('abort', () => {
      // console.log("abORT sIGNaL")
      abortedPrinting = true
    })

    const chunks = 64
    for (let i = 0; i < chunks; i++) {
      if (abortedPrinting) break
      onProgress(i / chunks)
      await delay(100)
    }
  }
}
