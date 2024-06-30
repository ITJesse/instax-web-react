import './App.css'

import viteLogo from '/vite.svg'
import { useRef } from 'react'

import reactLogo from './assets/react.svg'
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
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={handleConnect}>
          connect
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
