import { useContext } from 'react'

import { PrinterProviderContext } from './PrinterProvider/context'

export const usePrinter = () => useContext(PrinterProviderContext)
