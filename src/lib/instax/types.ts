export enum InstaxFilmVariant {
  MINI = 'mini',
  SQUARE = 'square',
  WIDE = 'wide',
}

export interface PrinterBatteryStatus {
  charging: boolean
  level: null | number
}

export interface PrinterStatus {
  type: InstaxFilmVariant

  battery: PrinterBatteryStatus
  polaroidCount: number | null
}

export interface PrinterStateConfig {
  type: InstaxFilmVariant

  connection: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  status?: PrinterStatus | null
}

export interface CHARACTERISTIC_REF {
  server: BluetoothRemoteGATTServer | null
  notify: BluetoothRemoteGATTCharacteristic | null
  write: BluetoothRemoteGATTCharacteristic | null
}

export interface ImageSupportInfo {
  width: number
  height: number
  picType: number
  picOption: number
  maxSize: number
}

export interface BatteryInfo {
  battery: number
}

export interface PrinterInfo {
  photosLeft: number
  isCharging: boolean
}
