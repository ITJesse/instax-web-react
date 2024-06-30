export enum INSTAX_OPCODES {
  UNKNOWN = 0xffff,
  SUPPORT_FUNCTION_AND_VERSION_INFO = 0x0000,
  DEVICE_INFO_SERVICE = 0x0001,
  SUPPORT_FUNCTION_INFO = 0x0002,
  IDENTIFY_INFORMATION = 0x0010,
  SHUT_DOWN = 0x0100,
  RESET = 0x0101,
  AUTO_SLEEP_SETTINGS = 0x0102,
  BLE_CONNECT = 0x0103,
  PRINT_IMAGE_DOWNLOAD_START = 0x1000,
  PRINT_IMAGE_DOWNLOAD_DATA = 0x1001,
  PRINT_IMAGE_DOWNLOAD_END = 0x1002,
  PRINT_IMAGE_DOWNLOAD_CANCEL = 0x1003,
  PRINT_IMAGE = 0x1080,
  REJECT_FILM_COVER = 0x1081,
  FW_DOWNLOAD_START = 0x2000,
  FW_DOWNLOAD_DATA = 0x2001,
  FW_DOWNLOAD_END = 0x2002,
  FW_UPGRADE_EXIT = 0x2003,
  FW_PROGRAM_INFO = 0x2010,
  FW_DATA_BACKUP = 0x2080,
  FW_UPDATE_REQUEST = 0x2081,
  XYZ_AXIS_INFO = 0x3000,
  LED_PATTERN_SETTINGS = 0x3001,
  AXIS_ACTION_SETTINGS = 0x3002,
  LED_PATTERN_SETTINGS_DOUBLE = 0x3003,
  POWER_ONOFF_LED_SETTING = 0x3004,
  AR_LED_VIBRARTION_SETTING = 0x3006,
  ADDITIONAL_PRINTER_INFO = 0x3010,
  PRINTER_HEAD_LIGHT_CORRECT_INFO = 0x3080,
  PRINTER_HEAD_LIGHT_CORRECT_SETTINGS = 0x3081,
  CAMERA_SETTINGS = 0x8000,
  CAMERA_SETTINGS_GET = 0x8001,
  URL_UPLOAD_INFO = 0x8100,
  URL_PICTURE_UPLOAD_START = 0x8101,
  URL_PICTURE_UPLOAD = 0x8102,
  URL_PICTURE_UPLOAD_END = 0x8103,
  URL_AUDIO_UPLOAD_START = 0x8104,
  URL_AUDIO_UPLOAD = 0x8105,
  URL_AUDIO_UPLOAD_END = 0x8106,
  URL_UPLOAD_ADDRESS = 0x8107,
  URL_UPLOAD_DATA_COMPLETE = 0x8108,
  LIVE_VIEW_START = 0x8200,
  LIVE_VIEW_RECEIVE = 0x8201,
  LIVE_VIEW_STOP = 0x8202,
  LIVE_VIEW_TAKE_PICTURE = 0x8210,
  POST_VIEW_UPLOAD_START = 0x8230,
  POST_VIEW_UPLOAD = 0x8231,
  POST_VIEW_UPLOAD_END = 0x8232,
  POST_VIEW_PRINT = 0x8240,
}
