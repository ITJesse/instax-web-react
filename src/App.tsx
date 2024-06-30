import './App.css'

import { useRef } from 'react'

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
    <AssetsLoader>
      <button onClick={handleConnect}>connect</button>
    </AssetsLoader>
  )
}

export default App
