import '@/App.css'

import { Button } from 'flowbite-react'

import { Editor } from '@/components/Editor'
import { StatusBar } from '@/components/StatusBar'

import { usePrinter } from './providers/PrinterProvider'

function App() {
  const { connect, connected } = usePrinter()
  return (
    <div className="w-full h-full min-h-screen bg-gray-50 flex flex-col">
      <StatusBar />
      <div className="w-full flex-1 flex justify-center items-center px-4">
        {connected ? (
          <Editor />
        ) : (
          <Button color="blue" onClick={connect}>
            连接打印机
          </Button>
        )}
      </div>
    </div>
  )
}

export default App
