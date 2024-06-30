import './App.css'

import { Button, DarkThemeToggle } from 'flowbite-react'
import { IoMdCheckmarkCircle, IoMdCloseCircle } from 'react-icons/io'

import { usePrinter } from './providers/PrinterProvider'

function App() {
  const { connect, disconnect, connected, deviceName } = usePrinter()

  return (
    <div className="w-full h-full min-h-screen bg-gray-50 flex flex-col">
      <div className="w-full bg-gray-100 flex justify-between items-center px-4 py-2">
        <Button
          size="xs"
          color="light"
          onClick={connected ? disconnect : connect}
        >
          {connected ? (
            <IoMdCheckmarkCircle className="text-green-500 mr-1 h-4 w-4" />
          ) : (
            <IoMdCloseCircle className="text-red-500 mr-1 h-4 w-4" />
          )}
          {connected ? deviceName : '打印机未连接'}
        </Button>
        <DarkThemeToggle />
      </div>
      <div className="w-full flex-1 flex justify-center items-center">
        {!connected && (
          <Button color="blue" onClick={connect}>
            连接打印机
          </Button>
        )}
      </div>
    </div>
  )
}

export default App
