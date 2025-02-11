import { Buffer } from 'buffer'
// provider for the instax printer
import localforage from 'localforage'
//
import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'

import { InstaxPrinter } from '@/lib/instax'
import { FakeInstaxPrinter } from '@/lib/instax/fake'

import { PrinterProviderContext, PrinterProviderCtx, PrinterQueueItem } from './context'

type Props = {
  fake?: boolean
}
export const PrinterProvider = ({
  children,
  fake,
}: PropsWithChildren<Props>) => {
  const printer = useRef(fake ? new FakeInstaxPrinter() : new InstaxPrinter())
  const [connected, setConnected] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [status, setStatus] = useState<PrinterProviderCtx['status']>(null)
  const [queue, setQueue] = useState<PrinterQueueItem[]>([])

  const onDisconnect = useCallback(() => {
    setConnected(false)
    setDeviceName('')
    setStatus(null)
    setQueue([])
  }, [])

  const connect = useCallback(async () => {
    const device = await printer.current.connect(onDisconnect)
    if (device) {
      setDeviceName((device.name ?? '').replace('(IOS)', ''))
      setConnected(true)
    }
  }, [onDisconnect])

  const disconnect = useCallback(async () => {
    queue.forEach((task) => task.signal.abort())
    await printer.current.disconnect()
  }, [queue])

  useEffect(() => {
    const task = async () => {
      const status = await printer.current.getInformation(true)
      setStatus(status)
    }

    if (connected) {
      task()
      const interval = setInterval(task, 5000)
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
