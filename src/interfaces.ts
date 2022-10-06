export enum Platform {
  cainiao = 'cainiao',
  pinduoduo = 'pinduoduo',
  jingdong = 'jingdong',
  douyin = 'doudian',
  meituan = 'meituan',
  kuaishou = 'kuaishou',
}

export interface IPrinter {
  /**
   * init websocket
   */
  connect: () => void | Promise<boolean>;
  /**
   * close websocket
   */
  disconnect: () => void;

  /**
   * send print task to platform print client,
   */
  print<T extends Response>(task: PrintTask): Promise<T>;

  /**
   * send print task to platform print client,
   */
  printPreview<T extends Response>(task: PrintTask): Promise<T>;
  /**
   * get printers
   */
  getPrinters<T extends Response>(): Promise<T>;

  /**
   * get specific printer config
   * @param printer -{string} - printer name
   */
  getPrinterConfig<T extends Response>(printer: string): Promise<T>;
  /**
   * 设置打印机配置
   * @param config
   */
  setPrinterConfig<T extends Response>(config: PrinterConfig): Promise<T>;
  /**
   * 打印通知
   * @param callback - 通知的回调方法
   */
  notifyPrintResult(callback: <T extends Response>(response: T) => void): void;
  /**
   * 获取任务打印任务状态
   * @param taskID - 打印机任务ID列表
   */
  getTaskStatus<T extends Response>(taskID: Array<string>): Promise<T>;
  /**
   * 获取全局配置
   */
  getGlobalConfig<T extends Response>(): Promise<T>;
  /**
   * 设置全局配置
   * @param config
   */
  setGlobalConfig<T extends Response>(config: { notifyOnTaskFailure?: boolean }): Promise<T>;
  /**
   * 获取客户端版本信息
   */
  getAgentInfo<T extends Response>(): Promise<T>;
}
export type JsonObject = Record<string, unknown>;
export interface Document extends JsonObject {
  /**
   * 文档的唯一ID，需要保证唯一,对于标准面单来讲，就是面单号;如果是自定义模板，需要保证唯一
   */
  documentID: string;
  /**
   * 模板需要的打印数据
   */
  contents: Array<{
    data?: JsonObject;
    addData?: JsonObject;
    customData?: JsonObject;
    encryptedData?: string;
    config?: JsonObject;
    params?: string;
    ver?: string;
    /**
     * 模板文件url
     */
    templateURL: string;
    /**
     * 模板与数据的签名
     */
    signature?: string;
  }>;
}

export interface JDDocumentContent {
  /**
   * 标准模版链接
   */
  tempUrl?: string;
  /**
   * 打印数据,printData只接收单个面单数据字符串，而不是多组数的数组数据；明文时为json数据对象
   */
  printData?: string;
  /**
   * 自定义区模板url
   */
  customTempUrl?: string;
  /**
   * 自定义数据,customData也只是单一面单的自定义数据字符串，并不是数组；如果有customTempUrl，必须提供customData数据
   */
  customData?: JsonObject;
  /**
   * 自定义发货人信息（替换返回密文中原有信息）
   */
  addData?: JsonObject;
  /**
   * 打印数据【printData】为明文，dataType=“app”
   */
  dataType: string;
}

export interface PrintTask extends JsonObject {
  /**
   * 打印机任务ID，每个打印任务会分配不同的且唯一的ID
   */
  taskID: string;

  /**
   * 是否预览.true为预览,false为打印
   */
  preview?: boolean;
  /**
   * 文档数组，每个数据表示一页。 京东打印组件使用 【parameters】 属性
   */
  documents: Array<Document>;

  /**
   * 打印机名，如果为空，会使用默认打印机
   */
  printer?: string;
  /**
   * 预览模式,'pdf' | 'image'
   */
  previewType?: string;
  /**
   * 打印通知类型:“render”, “print”
   * [“render”] : 仅渲染响应 notify
   * [“print”] : 仅出纸响应 notify
   * “render”, “print” : 渲染完成会响应 notify && 出纸完成后会响应 notify
   * [] : 不允许
   *  注:如果notifyType没有指定，默认为[“render”, “print”]
   */
  notifyType?: Array<'render' | 'print'>;
  /**
   * task 起始 document 序号
   */
  firstDocumentNumber?: number;
  /**
   * task document 总数
   */
  totalDocumentCount?: number;
  /**
   * 京东打印组件请求参数字段,其他平台使用documents 中的数据
   */
  parameters?: { printName?: string; contents: Array<JDDocumentContent> } & JsonObject;
}

export interface PrinterConfig extends Record<string, any> {
  /**
   * printer name
   */
  name: string;
  /**
   * 水平偏移量
   */
  horizontalOffset?: number;
  /**
   * 垂直偏移量
   */
  verticalOffset?: number;
  /**
   * 强制设置页面无空边;
   * true为强制设置页面无空边,
   * false为由打印机驱动决定
   */
  forceNoPageMargins?: boolean;
  /**
   * 打印机纸张的宽度和高度, 单位毫米
   */
  paperSize?: { width?: number; height?: number };
  /**
   * 自适应纸张大小
   */
  autoPageSize?: boolean;
  /**
   * 0：纵向 1： 横向
   */
  orientation?: 0 | 1;
  /**
   * 按照 orientation 适应纸张方向
   */
  autoOrientation?: boolean;
  /**
   * 缩放比例
   */
  scale?: number;
  /**
   * 打印速度
   */
  speed?: number;
  /**
   * 分辨率
   */
  dpi?: number;
  /**
   * 打印浓度
   */
  density?: number;
  /**
   * 是否需要模板上联的快递logo
   */
  needTopLogo?: boolean;
  /**
   * 是否需要模板下联的快递logo
   */
  needBottomLogo?: boolean;
}
/**
 * 打印组件协议头
 */
export interface ProtocolHeader extends JsonObject {
  cmd: CMD;
  requestID: string;
}
/**
 * 发送到打印组件协议请求头
 */
export interface Request extends ProtocolHeader {
  version: string;
}
/**
 * 打印组件协议相应
 */
export interface Response extends ProtocolHeader {
  success?: boolean;
  msg?: string;
}
export type CMD =
  | 'getPrinters'
  | 'getPrinterConfig'
  | 'setPrinterConfig'
  | 'print'
  | 'notifyPrintResult'
  | 'getTaskStatus'
  | 'getGlobalConfig'
  | 'setGlobalConfig'
  | 'getAgentInfo'
  | 'PRE_View'
  | 'PRE_View:multi'
  | 'getCurrentToken';
