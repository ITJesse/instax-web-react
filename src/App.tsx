import './App.css'

import clsx from 'clsx'
import { Button, DarkThemeToggle } from 'flowbite-react'
import { useMemo } from 'react'
import { FaPhotoFilm } from 'react-icons/fa6'
import { IoMdCheckmarkCircle, IoMdCloseCircle } from 'react-icons/io'
import {
  MdBattery20,
  MdBattery30,
  MdBattery50,
  MdBattery60,
  MdBattery80,
  MdBattery90,
  MdBatteryAlert,
  MdBatteryCharging20,
  MdBatteryCharging30,
  MdBatteryCharging50,
  MdBatteryCharging60,
  MdBatteryCharging80,
  MdBatteryCharging90,
  MdBatteryChargingFull,
  MdBatteryFull,
  MdBatteryUnknown,
} from 'react-icons/md'

import { usePrinter } from './providers/PrinterProvider'

function App() {
  const { connect, disconnect, connected, deviceName, status } = usePrinter()

  const batteryIcon = useMemo(() => {
    if (!status) return <MdBatteryUnknown />
    const { level, charging } = status.battery
    if (charging) {
      if (level < 25) return <MdBatteryCharging20 />
      if (level < 35) return <MdBatteryCharging30 />
      if (level < 55) return <MdBatteryCharging50 />
      if (level < 65) return <MdBatteryCharging60 />
      if (level < 85) return <MdBatteryCharging80 />
      if (level < 95) return <MdBatteryCharging90 />
      return <MdBatteryChargingFull />
    }
    if (level < 20) return <MdBatteryAlert />
    if (level < 25) return <MdBattery20 />
    if (level < 35) return <MdBattery30 />
    if (level < 55) return <MdBattery50 />
    if (level < 65) return <MdBattery60 />
    if (level < 85) return <MdBattery80 />
    if (level < 95) return <MdBattery90 />
    return <MdBatteryFull />
  }, [status])

  const batteryIconColor = useMemo(() => {
    if (!status) return 'text-gray-500'
    const { level, charging } = status.battery
    if (charging) return 'text-green-500'
    if (level < 20) return 'text-red-500'
    if (level < 35) return 'text-orange-500'
    return 'text-gray-500'
  }, [status])

  const batteryLevel = useMemo(() => {
    if (!status) return 0
    if (status.battery.level >= 95) return 100
    return status.battery.level
  }, [status])

  return (
    <div className="w-full h-full min-h-screen bg-gray-50 flex flex-col">
      <div className="w-full bg-gray-100 flex justify-between items-center px-2 sm:px-4 py-1 sm:py-2">
        <div className="flex flex-row gap-4 sm:gap-8">
          <Button
            size="xs"
            color="light"
            onClick={connected ? disconnect : connect}
            className="whitespace-nowrap"
          >
            {connected ? (
              <IoMdCheckmarkCircle className="text-green-500 mr-1 h-4 w-4" />
            ) : (
              <IoMdCloseCircle className="text-red-500 mr-1 h-4 w-4" />
            )}
            {connected ? deviceName : '打印机未连接'}
          </Button>
          <div className="flex flex-row gap-2 text-gray-500 text-sm items-center">
            <FaPhotoFilm className="h-4 w-4" />
            <span>{status?.polaroidCount ?? '?'}/10</span>
          </div>
          <div className="flex flex-row gap-1 text-gray-500 text-sm items-center">
            <div
              className={clsx(
                'text-lg text-gray-500 flex items-center',
                batteryIconColor,
              )}
            >
              {batteryIcon}
            </div>
            <span>{batteryLevel}%</span>
          </div>
        </div>
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
