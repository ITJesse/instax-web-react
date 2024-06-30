// instax.bluetooth.ts
import { INSTAX_PRINTER_NAME_PREFIX, INSTAX_PRINTER_SERVICES } from './config'
import { CHARACTERISTIC_REF } from './types'

export class InstaxBluetooth {
  protected _characteristicRef: CHARACTERISTIC_REF = {
    server: null,
    notify: null,
    write: null,
  }

  protected isBusy = false
  /**
   * manually disconnects the printer
   */
  async disconnect(): Promise<void> {
    try {
      if (this._characteristicRef.notify !== null) {
        await this._characteristicRef.notify.stopNotifications()
      }
      this._characteristicRef.server!.disconnect()
    } catch (error) {
      console.error('> error on manual disconnect: ', error)
      return
    }
  }

  protected async notifications(
    callback: (event: Event) => void,
  ): Promise<void> {
    if (this._characteristicRef.notify == null) return

    const va = await this._characteristicRef.notify.startNotifications()

    await new Promise<void>(() => {
      va.addEventListener('characteristicvaluechanged', (e) => {
        // Do something with the event data here...
        callback(e)
      })
    })
  }

  protected async send(command: Uint8Array, response = true) {
    if (this.isBusy === true) return
    this.isBusy = true
    let timeout: ReturnType<typeof setTimeout> | null = null

    // console.log('SEND', Array.from(command))
    let notificationHandle: BluetoothRemoteGATTCharacteristic | null = null
    let notificationPromise = null
    let timeoutPromise = null
    if (response === true) {
      notificationHandle =
        await this._characteristicRef.notify!.startNotifications()

      notificationPromise = new Promise((resolve) => {
        notificationHandle?.addEventListener(
          'characteristicvaluechanged',
          (e) => {
            if (timeout) clearTimeout(timeout)

            resolve(e)
          },
        )
      })

      timeoutPromise = new Promise<Event>((resolve, reject) => {
        timeout = setTimeout(() => {
          notificationHandle?.removeEventListener(
            'characteristicvaluechanged',
            () => {},
          )
          reject(new Error('Notification timeout'))
        }, 500)
      })
    }

    await this._characteristicRef.write!.writeValueWithoutResponse(command)
    this.isBusy = false
    if (response != true) return

    try {
      const event = await Promise.race([notificationPromise, timeoutPromise])
      if (event) {
        return event
      } else {
        throw new Error('Unexpected void return')
      }
    } finally {
      if (timeout) clearTimeout(timeout)
      await notificationHandle?.stopNotifications()
    }
  }

  /**
   * Connects to the printer.
   */
  async connect(onDisconnect?: () => void): Promise<BluetoothDevice> {
    try {
      let deviceHandle: BluetoothDevice | null = null
      const connected = await navigator.bluetooth
        .requestDevice({
          filters: [
            {
              namePrefix: INSTAX_PRINTER_NAME_PREFIX,
            },
          ],
          optionalServices: INSTAX_PRINTER_SERVICES,
        })
        .then((device: BluetoothDevice) => {
          deviceHandle = device
          device.addEventListener('gattserverdisconnected', () => {
            this._characteristicRef.write = null
            this._characteristicRef.notify = null
            onDisconnect?.()
          })
          // device.watchAdvertisements()
          // device.addEventListener(
          //   'advertisementreceived',
          //   this.interpretIBeacon,
          // )
          return device.gatt!.connect()
        })
        .then((server: BluetoothRemoteGATTServer) => {
          this._characteristicRef.server = server
          return server.getPrimaryService(INSTAX_PRINTER_SERVICES[0])
        })
        .then((service: BluetoothRemoteGATTService) => {
          return service.getCharacteristics()
        })
        .then((characteristics: BluetoothRemoteGATTCharacteristic[]) => {
          if (characteristics === null)
            throw new Error('invalid-characteristic')

          const writeCharacteristic = characteristics.reduce(
            (
              a: BluetoothRemoteGATTCharacteristic,
              b: BluetoothRemoteGATTCharacteristic,
            ) =>
              a.properties.write && a.properties.writeWithoutResponse ? a : b,
          )
          const notificationsCharacteristic = characteristics.reduce(
            (
              a: BluetoothRemoteGATTCharacteristic,
              b: BluetoothRemoteGATTCharacteristic,
            ) => (a.properties.notify ? a : b),
          )

          if (
            notificationsCharacteristic === null ||
            !notificationsCharacteristic.properties.notify ||
            writeCharacteristic === null ||
            !writeCharacteristic.properties.write
          ) {
            throw new Error('missing-characteristics')
          }

          this._characteristicRef.notify = notificationsCharacteristic
          this._characteristicRef.write = writeCharacteristic

          console.log('> PRINTER CONNECTED')
          return true
        })

      if (connected === true) return deviceHandle!
      throw new Error()
    } catch (error) {
      console.error('error on connect: ', error)
      this._characteristicRef.notify = null
      this._characteristicRef.write = null
      throw error
    }
  }

  // protected interpretIBeacon(event: BluetoothAdvertisingEvent) {
  //   const rssi = event.rssi ?? 0
  //   const appleData = event.manufacturerData.get(0x004c)
  //   if (
  //     appleData?.byteLength != 23 ||
  //     appleData?.getUint16(0, false) !== 0x0215
  //   ) {
  //     console.log({ isBeacon: false })
  //   }
  //   if (!appleData) return
  //   const uuidArray = new Uint8Array(appleData.buffer, 2, 16)
  //   const major = appleData.getUint16(18, false)
  //   const minor = appleData.getUint16(20, false)
  //   const txPowerAt1m = -appleData.getInt8(22)
  //   console.log({
  //     isBeacon: true,
  //     uuidArray,
  //     major,
  //     minor,
  //     pathLossVs1m: txPowerAt1m - rssi,
  //   })
  // }
}
