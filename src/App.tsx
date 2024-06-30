import '@/App.css'

import { Editor } from '@/components/Editor'
import { StatusBar } from '@/components/StatusBar'

function App() {
  return (
    <div className="w-full h-full min-h-screen bg-gray-50 flex flex-col">
      <StatusBar />
      <div className="w-full flex-1 flex justify-center items-center">
        <Editor />
      </div>
    </div>
  )
}

export default App
