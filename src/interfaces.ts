export enum Platform {
  cainiao = 'cainiao',
  pinduoduo = 'pinduoduo',
  jingdong = 'jingdong',
  douyin = 'douyin',
  meituan = 'meituan',
  kuaishou = 'kuaishou',
}

export interface IPrinter {
  /**
   * init websocket
   */
  connect: () => void;
  /**
   * close websocket
   */
  disConnect: () => void;
  /**
   * send message to platform print client,
   */
  send: (jsonData: string) => void;
}
/**
 * 打印组件协议头
 */
export interface ProtocolHeader {
  cmd: string;
  requestID: string;
  [x: string]: any;
}
/**
 * 发送到打印组件协议请求头
 */
export interface RequestHeader extends ProtocolHeader {
  version: string;
}
/**
 * 打印组件协议相应头
 */
export interface ResponseHeader extends ProtocolHeader {}
