import '@/index.css'

import { Flowbite } from 'flowbite-react'
import React from 'react'
import ReactDOM from 'react-dom/client'

import App from '@/App.tsx'
import { AssetsLoader } from '@/components/AssetsLoader.tsx'
import { PrinterProvider } from '@/providers/PrinterProvider.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrinterProvider fake>
      <Flowbite>
        <AssetsLoader>
          <App />
        </AssetsLoader>
      </Flowbite>
    </PrinterProvider>
  </React.StrictMode>,
)
