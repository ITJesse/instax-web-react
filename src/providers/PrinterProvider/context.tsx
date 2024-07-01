import { createContext } from 'react'

import { InstaxFilmVariant } from '@/lib/instax/types'

export type PrinterQueueItem = {
  id: string
  quantity: number
  signal: AbortController
  sendProgress: number
  printingProgress: number
  status:
    | 'pending'
    | 'sending'
    | 'sended'
    | 'printing'
    | 'done'
    | 'error'
    | 'canceled'
}
export type PrinterProviderCtx = {
  connected: boolean
  deviceName: string
  status: {
    battery: {
      charging: boolean
      level: number
    }
    polaroidCount: number
    type: InstaxFilmVariant
    width: number
    height: number
    waitTime: number
  } | null
  queue: PrinterQueueItem[]
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  addPrintTask: (image: Blob, quantity?: number) => void
  cancelTask: (id: string) => void
}

const DEFAULT_STATUS = {
  deviceName: '',
  connected: false,
  status: null,
  queue: [],
  connect: async () => {},
  disconnect: async () => {},
  addPrintTask: async () => {},
  cancelTask: () => {},
}

export const PrinterProviderContext =
  createContext<PrinterProviderCtx>(DEFAULT_STATUS)
