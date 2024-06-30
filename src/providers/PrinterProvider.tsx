import { Buffer } from 'buffer'
// provider for the instax printer
import localforage from 'localforage'
//
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { InstaxPrinter } from '../lib/instax'
import { InstaxFilmVariant } from '../lib/instax/types'

const _printer = new InstaxPrinter()
type PrinterQueueItem = {
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
type PrinterProviderCtx = {
  printer: InstaxPrinter
  connected: boolean
  deviceName: string
  status: {
    battery: {
      charging: boolean
      level: number
    }
    polaroidCount: number
    type: InstaxFilmVariant
  } | null
  queue: PrinterQueueItem[]
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  addPrintTask: (image: Blob, quantity?: number) => void
  cancelTask: (id: string) => void
}

const DEFAULT_STATUS = {
  printer: _printer,
  deviceName: '',
  connected: false,
  status: null,
  queue: [],
  connect: async () => {},
  disconnect: async () => {},
  addPrintTask: async () => {},
  cancelTask: () => {},
}

const PrinterProviderContext = createContext<PrinterProviderCtx>(DEFAULT_STATUS)

export const PrinterProvider = ({ children }: { children: ReactNode }) => {
  const printer = useRef(_printer)
  const [connected, setConnected] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [status, setStatus] = useState<PrinterProviderCtx['status']>(null)
  const [queue, setQueue] = useState<PrinterQueueItem[]>([])

  const connect = useCallback(async () => {
    const device = await printer.current.connect()
    if (device) {
      setDeviceName(device.name ?? '')
      setConnected(true)
    }
  }, [])

  const disconnect = useCallback(async () => {
    await printer.current.disconnect()
    setConnected(false)
  }, [])

  useEffect(() => {
    if (connected) {
      const interval = setInterval(async () => {
        const status = await printer.current.getInformation()
        setStatus(status)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [connected])

  const addPrintTask = useCallback((image: Blob, quantity?: number) => {
    const task = {
      id: Date.now().toString(),
      quantity: quantity || 1,
      signal: new AbortController(),
      sendProgress: 0,
      printingProgress: 0,
      status: 'pending' as const,
    }
    localforage.setItem(task.id, image)
    setQueue((prev) => [...prev, task])
  }, [])

  const cancelTask = useCallback(
    (id: string) => {
      const task = queue.find((t) => t.id === id)
      if (!task) return
      task.signal?.abort()
      if (
        task.status === 'sending' ||
        (task.status === 'printing' && task.quantity > 1)
      ) {
        setQueue((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: 'canceled' } : t)),
        )
      }
    },
    [queue],
  )

  const startSending = useCallback(
    async (task: PrinterQueueItem) => {
      if (!connected) return
      if (!status) return
      setQueue((prev) => [
        ...prev.map((t) =>
          t.id === task.id ? { ...t, status: 'sending' as const } : t,
        ),
      ])
      const image = await localforage.getItem<Blob>(task.id)
      if (!image) {
        setQueue((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: 'error' as const } : t,
          ),
        )
        return
      }
      const imageBuf: Buffer = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve(Buffer.from(reader.result as ArrayBuffer))
        }
        reader.readAsArrayBuffer(image)
      })
      await printer.current.sendImage(
        imageBuf,
        status?.type,
        true,
        (p) =>
          setQueue((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, sendProgress: p } : t)),
          ),
        task.signal.signal,
      )
      setQueue((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'sended' } : t)),
      )
    },
    [status, connected],
  )

  const startPrinting = useCallback(
    async (task: PrinterQueueItem) => {
      if (!connected) return
      if (!status) return
      setQueue((prev) => [
        ...prev.map((t) =>
          t.id === task.id ? { ...t, status: 'printing' as const } : t,
        ),
      ])
      const quantity = task.quantity
      const signal = task.signal.signal
      let aborted = false
      signal.addEventListener('abort', () => {
        aborted = true
        setQueue((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: 'canceled' as const } : t,
          ),
        )
      })
      for (let i = 0; i < quantity; i++) {
        if (aborted) return
        await printer.current.printImage()
        setQueue((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, printingProgress: i / quantity, status: 'printing' }
              : t,
          ),
        )
      }
      await printer.current.printImage()
    },
    [status, connected],
  )

  // update queue
  const interval = useRef<number | null>(null)
  useEffect(() => {
    if (!connected) return
    if (!status) return
    if (queue.length === 0) return

    const updateQueue = async () => {
      const sendingTasks = queue.filter((t) => t.status === 'sending')
      const sendedTasks = queue.filter((t) => t.status === 'sended')
      const printingTasks = queue.filter((t) => t.status === 'printing')
      const pendingTasks = queue.filter((t) => t.status === 'pending')

      if (sendedTasks.length > 0 && printingTasks.length === 0) {
        startPrinting(sendedTasks[0])
        return
      }

      if (
        pendingTasks.length > 0 &&
        sendingTasks.length === 0 &&
        printingTasks.length === 0
      ) {
        startSending(pendingTasks[0])
        return
      }
    }
    interval.current = setInterval(updateQueue, 1000)
    return () =>
      interval.current ? clearInterval(interval.current) : undefined
  }, [queue, connected, status, startSending, startPrinting])

  return (
    <PrinterProviderContext.Provider
      value={{
        printer: printer.current,
        deviceName,
        connected,
        status,
        queue,
        connect,
        disconnect,
        addPrintTask,
        cancelTask,
      }}
    >
      {children}
    </PrinterProviderContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePrinter = () => useContext(PrinterProviderContext)
