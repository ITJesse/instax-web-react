import { Buffer } from 'buffer'

import { delay } from '../utils'
import { InstaxBluetooth } from './bluetooth'
import { encodeColor } from './color'
import { INSTAX_OPCODES } from './events'
import { parse } from './parser'
import {
  BatteryInfo,
  ImageSupportInfo,
  InstaxFilmVariant,
  PrinterInfo,
} from './types'

export class InstaxPrinter extends InstaxBluetooth {
  constructor() {
    super()
  }

  // Helper function to convert Uint8Array into a human-readable hexadecimal string
  private printableHex(command: Uint8Array): string {
    return Array.from(command, (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join(' ')
  }

  public async setColor(
    colors: string[],
    speed = 20,
    repeat = 0,
    when = 0,
  ): Promise<void> {
    await this.sendCommand(
      INSTAX_OPCODES.LED_PATTERN_SETTINGS,
      encodeColor(colors, speed, repeat, when),
      false,
    )
  }

  // Sends a command to the printer
  private async sendCommand<T>(
    opCode: number,
    command: number[],
    awaitResponse = true,
  ): Promise<T> {
    // Encode the command into the Instax packet format
    const instaxCommandData: Uint8Array = this.encode(opCode, command)

    // Log the command as a hex string for debugging purposes
    // console.log(">", this._printableHex(instaxCommandData));

    const response = await this.send(instaxCommandData, awaitResponse)
    return this._decode(response as Event) as T
  }

  async getInformation(includeType = false) {
    const printerStatus = {
      battery: {
        charging: false,
        level: 0,
      },
      polaroidCount: 0,
      type: InstaxFilmVariant.MINI,
      width: 800,
      height: 800,
      waitTime: 15,
    }
    let response = null
    if (includeType == true) {
      response = await this.sendCommand<ImageSupportInfo>(
        INSTAX_OPCODES.SUPPORT_FUNCTION_INFO,
        [0],
      )

      const width = parseInt(
        String(
          response.width != 600 &&
            response.width != 800 &&
            response.width != 1260
            ? 800
            : response.width,
        ),
      ) as 600 | 800 | 1260
      const height = parseInt(
        String(
          response.height != 800 && response.height != 840
            ? 800
            : response.height,
        ),
      ) as 800 | 840
      printerStatus.width = width
      printerStatus.height = height
      if (width == 1260 && height == 840) {
        printerStatus.type = InstaxFilmVariant.WIDE
      } else if (width == 800) {
        printerStatus.type = InstaxFilmVariant.SQUARE
      } else if (width == 600) {
        printerStatus.type = InstaxFilmVariant.MINI
      }
    }
    response = await this.sendCommand<BatteryInfo>(
      INSTAX_OPCODES.SUPPORT_FUNCTION_INFO,
      [1],
    )

    printerStatus.battery.level = response.battery

    response = await this.sendCommand<PrinterInfo>(
      INSTAX_OPCODES.SUPPORT_FUNCTION_INFO,
      [2],
    )
    printerStatus.polaroidCount = response.photosLeft
    printerStatus.battery.charging = response.isCharging
    printerStatus.waitTime = response.waitTime
    return printerStatus
  }

  async printImage(): Promise<void> {
    await this.sendCommand(INSTAX_OPCODES.PRINT_IMAGE, [], true)
  }

  async sendImage(
    imageData: Buffer,
    type: InstaxFilmVariant,
    enable3DLut: boolean,
    onProgress: (progress: number) => void,
    signal: AbortSignal,
  ): Promise<void> {
    console.log('SEND IAMGE')
    console.log('IMAGE DATA: ', imageData)
    const chunks = this.imageToChunks(
      imageData,
      type == InstaxFilmVariant.SQUARE ? 1808 : 900,
    )

    let abortedPrinting = false

    signal.addEventListener('abort', () => {
      // console.log("abORT sIGNaL")
      abortedPrinting = true
      this.sendCommand<{ status: number }>(
        INSTAX_OPCODES.PRINT_IMAGE_DOWNLOAD_CANCEL,
        [],
      )
    })

    console.log(
      'SEND LENGTH',
      imageData.length,
      Array.from(new Uint8Array(new Uint16Array([imageData.length]).buffer)),
    )
    // 0x08 wide ; 0x00 square
    // 0x02 wide at end; 0x00 square

    try {
      const imageDataLength = imageData.length // Assuming imageData.length gives the length you want to convert
      // Convert imageDataLength to a Uint16Array
      const uint16Array = new Uint16Array([imageDataLength])
      // Create a DataView wrapping the ArrayBuffer of the Uint16Array
      const dataView = new DataView(uint16Array.buffer)
      // Get the 16-bit unsigned integer from the DataView in big-endian format
      const bigEndianValue = dataView.getUint16(0, false) // false for big-endian
      // Convert the big-endian value to a Uint8Array
      const bigEndianBytes = new Uint8Array(
        new Uint16Array([bigEndianValue]).buffer,
      )
      // Use the bigEndianBytes in your command
      const response = await this.sendCommand(
        INSTAX_OPCODES.PRINT_IMAGE_DOWNLOAD_START,
        [
          0x02,
          enable3DLut ? 0x08 : 0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          ...Array.from(bigEndianBytes),
        ],
      )

      if (response == null) throw new Error("Can't start sending")

      console.log('SENDING PACKETS...')
      for (let packetId = 0; packetId < chunks.length; packetId++) {
        if (abortedPrinting) {
          await delay(500)
          await this.sendCommand(
            INSTAX_OPCODES.PRINT_IMAGE_DOWNLOAD_CANCEL,
            [],
            false,
          )
          console.log('CANCEL COMMAND')
          onProgress(-1)
          break
        }
        console.log(`Packet ${packetId}/${chunks.length}`)

        const chunk = this.encode(
          INSTAX_OPCODES.PRINT_IMAGE_DOWNLOAD_DATA,
          Array.from(chunks[packetId]),
        )

        console.log('CHUNK', this.printableHex(chunk))

        for (let index = 0; index < chunks[packetId].length + 7; index += 182) {
          const isPacketEnd = index > chunks[packetId].length + 7 - 182
          const splitChunk = chunk.slice(index, index + 182)
          // console.log("IS END", isPacketEnd, chunk.slice(index + 182, chunk.length))
          const response = await this.send(splitChunk, isPacketEnd)
          if (isPacketEnd && response == null) {
            // console.log(this._decode(response as Event)?.status);
            throw new Error('Failed to send packet')
          }

          onProgress(
            (packetId * chunks[packetId].length + index) /
              (chunks[packetId].length * chunks.length),
          )

          // console.log(printTimeout)
          await delay(25)
        }
      }

      if (!abortedPrinting) {
        const finishResponse = await this.sendCommand(
          INSTAX_OPCODES.PRINT_IMAGE_DOWNLOAD_END,
          [],
          true,
        )
        console.log('finishResponse', finishResponse)
      }
    } catch (error) {
      console.log('send image error', error)
      await this.sendCommand<{ status: number }>(
        INSTAX_OPCODES.PRINT_IMAGE_DOWNLOAD_CANCEL,
        [],
        true,
      )
    }
  }

  private createImageDataChunk(index: number, chunk: Uint8Array): Uint8Array {
    // Create a Uint32Array containing the index
    const indexArray = new Uint32Array([index])

    // Convert the indexArray to a Uint8Array
    const indexBytes = new Uint8Array(indexArray.buffer)

    // Create a new Uint8Array for the combined data
    const combined = new Uint8Array(4 + chunk.length)

    // Manually reorder the bytes to Big Endian format
    for (let i = 0; i < 4; i++) {
      combined[i] = indexBytes[3 - i] // Reverse the byte order
    }

    // Copy the chunk data into the combined array, after the index
    combined.set(chunk, 4)

    return combined
  }

  private imageToChunks(imgData: Uint8Array, chunkSize = 900): Uint8Array[] {
    const imgDataChunks = []

    // pad the last chunk with zeroes if needed
    for (let i = 0; i < imgData.length; i += chunkSize) {
      const chunk = imgData.slice(i, i + chunkSize)
      imgDataChunks.push(chunk)
    }

    if (imgDataChunks[imgDataChunks.length - 1].length < chunkSize) {
      const lastChunk = imgDataChunks[imgDataChunks.length - 1]
      const padding = new Uint8Array(chunkSize - lastChunk.length)
      imgDataChunks[imgDataChunks.length - 1] = new Uint8Array([
        ...lastChunk,
        ...padding,
      ])
    }

    // Create image data chunks with index
    for (let i = 0; i < imgDataChunks.length; i++) {
      imgDataChunks[i] = this.createImageDataChunk(i, imgDataChunks[i])
    }

    return imgDataChunks
  }

  private _decode(event: Event) {
    if (event == null || event.target == null) return
    const packet = Array.from(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new Uint8Array((event.target as any).value.buffer),
    )

    // Validate the packet length and checksum
    const packetLength = (packet[2] << 8) | packet[3]

    const packetChecksum = packet.reduce((acc, val) => acc + val, 0) & 255

    if (packetLength !== packet.length || packetChecksum !== 255) {
      throw new Error('Invalid packet')
    }

    if (packet[0] != 0x61 || packet[1] != 0x42) throw new Error()

    // console.log(">", this._printableHex(new Uint8Array(packet)));

    // Extract the event data from the packet
    const opCode = (packet[4] << 8) | packet[5]
    const status = packet[6]
    const command = packet[7]
    const payload = packet.slice(8, packet.length - 1)

    // console.log(status)
    // Return the decoded packet data
    return parse(opCode, command, payload, status)
  }

  /**
   * encode
   * @param opcode
   * @param payload
   * @returns
   */
  private encode(opcode: number, payload: number[]): Uint8Array {
    // Calculate the length of the command packet
    const length = payload.length + 7

    // create the command packet array:
    // - 0x41 and 0x62 are the default headers for Instax printer commands
    // - the next two bytes are the high and low bytes of the packet length
    // - the following two bytes are the high and low bytes of the opcode
    // - the remaining bytes are the payload
    const commandPacket = [
      0x41,
      0x62,
      (length >> 8) & 0xff,
      length & 0xff,
      opcode >> 8,
      opcode & 0xff,
      ...payload,
    ]

    // @TODO: check if invalid packet size or OP-code

    // calculate the checksum of the command packet
    const checksum = commandPacket.reduce((acc, val) => acc + val, 0) & 0xff
    // return the command packet as a Uint8Array with the checksum appended
    return new Uint8Array([...commandPacket, checksum ^ 0xff])
  }
}
