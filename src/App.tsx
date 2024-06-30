import './App.css'

import { Button, DarkThemeToggle, Flowbite } from 'flowbite-react'
import { useRef } from 'react'
import { IoMdCloseCircle } from 'react-icons/io'

import { AssetsLoader } from './components/AssetsLoader'
import { InstaxPrinter } from './lib/instax'

function App() {
  const bluetooth = useRef(new InstaxPrinter())

  const handleConnect = async () => {
    if (bluetooth.current === null) return
    const device = await bluetooth.current.connect()
    console.log(device)
    console.log(await bluetooth.current.getInformation(true))
  }

  return (
    <Flowbite>
      <AssetsLoader>
        <div className="w-full h-full min-h-screen bg-gray-800 flex flex-col">
          <div className="w-full bg-gray-700 flex justify-between items-center px-4 py-2">
            <div className="flex flex-row gap-2 justify-center items-center">
              <IoMdCloseCircle className="text-red-500" />
              <span>打印机未连接</span>
            </div>
            <DarkThemeToggle />
          </div>
          <div className="w-full flex-1 flex justify-center items-center">
            <Button color="blue" onClick={handleConnect}>
              连接打印机
            </Button>
          </div>
        </div>
      </AssetsLoader>
    </Flowbite>
  )
}

export default App
