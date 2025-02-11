import { INSTAX_OPCODES } from './events'

const twoByteInt = (offset: number, byteArray: number[]) => {
  return byteArray.length < offset + 2
    ? 0
    : (byteArray[offset] << 8) | byteArray[offset + 1]
}

const oneByteInt = (offset: number, byteArray: number[]) => {
  return byteArray.length < offset + 1 ? 0 : byteArray[offset]
}

const fourByteInt = (offset: number, byteArray: number[]) => {
  return byteArray.length < offset + 4
    ? 0
    : (byteArray[offset] << 24) |
        (byteArray[offset + 1] << 16) |
        (byteArray[offset + 2] << 8) |
        byteArray[offset + 3]
}

export function parse(
  eventCode: number,
  command: number,
  payload: number[],
  status: number,
) {
  if (eventCode === INSTAX_OPCODES.DEVICE_INFO_SERVICE) {
    const asciiResponse = String.fromCharCode(
      ...payload.filter((code) => code !== 8),
    )
    switch (command) {
      case 0:
        return { company: asciiResponse }

      case 1:
        return { printerTypeId: asciiResponse }

      case 2:
        return { serialNumber: asciiResponse }

      default:
        return { eventCode, command, payload }
    }
  } else if (eventCode === INSTAX_OPCODES.SUPPORT_FUNCTION_INFO) {
    switch (command) {
      case 0:
        return {
          width: twoByteInt(0, payload),
          height: twoByteInt(2, payload),
          picType: oneByteInt(4, payload),
          picOption: oneByteInt(5, payload),
          maxSize: fourByteInt(6, payload),
        }

      case 1:
        // const batteryLevelInfo = oneByteInt(0, payload)
        // const batteryCapacity = oneByteInt(1, payload)
        // const chargerType = oneByteInt(2, payload)
        // const chargerState = oneByteInt(3, payload)
        return {
          battery: oneByteInt(1, payload),
        }

      case 2:
        return {
          photosLeft: payload[0] & 0xf,
          isCharging: ((1 << 7) & payload[0]) >= 1,
          waitTime: oneByteInt(3, payload),
        }

      default:
        break
    }
  } else {
    return { eventCode, command, payload, status }
  }
}
