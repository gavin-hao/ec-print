import PrinterProvider, { PrinterProps } from '../printProvider';
import { Response, Request, CMD, JsonObject, PrintTask } from '../interfaces';
import { debug } from 'util';

const Url = 'ws://localhost:9113';
/**
 * 京东打印组件，默认使用2.0协议版本。需要安装最新的京东打印组件客户端。version>=3.3.2.7
 */
export interface JDRequest extends JsonObject {
  orderType: string;
  key: string;
  dataType: string;
  parameters: JsonObject;
}
export interface JDResponse extends JsonObject {
  code: string;
  success: string;
  message: string;
  key?: string;
  content?: string;
  status: string;
  detailinfo?: { printers?: string[] } & JsonObject;
}
class JingdongPrinter extends PrinterProvider {
  readonly providerKey: string = 'jingdong';
  private version: string;
  constructor(props: PrinterProps = { url: Url }) {
    const url = props.url || Url;
    super({ url, options: props.options });
    this.version = props.version || '1.0';
  }

  printPreview<T extends Response>(task: PrintTask): Promise<T> {
    let cmd: CMD = 'PRE_View';
    if (task.previewMulti) {
      cmd = 'PRE_View:multi';
    }
    const req = this.getRequestHeader(cmd);
    return this.request({ ...req, ...{ ...task, preview: true } }) as Promise<T>;
  }
  getPrinters<T extends Response>(): Promise<T> {
    const req = this.getRequestHeader('getPrinters');
    return this.request({ ...req }) as Promise<T>;
  }
  notifyPrintResult(callback: <T extends Response>(response: T) => void): void {
    // throw new Error('Method not implemented.');
    console.log('Method not implemented.');
  }
  getTaskStatus<T extends Response>(taskID: string[]): Promise<T> {
    // throw new Error('Method not implemented.');
    console.log('[jingdong] Method not supported.');
    const req = this.getRequestHeader('getTaskStatus');
    return Promise.resolve({ ...req, taskID } as unknown as T);
  }
  setGlobalConfig<T extends Response>(config: { notifyOnTaskFailure?: boolean | undefined }): Promise<T> {
    // throw new Error('Method not implemented.');
    console.log('[jingdong] Method not supported.');
    const req = this.getRequestHeader('setGlobalConfig');
    return Promise.resolve({ ...req, config } as unknown as T);
  }
  getGlobalConfig<T extends Response>(): Promise<T> {
    // throw new Error('Method not implemented.');
    console.log('[jingdong] Method not supported.');
    const req = this.getRequestHeader('getGlobalConfig');
    return Promise.resolve({ ...req } as unknown as T);
  }
  getAgentInfo<T extends Response>(): Promise<T> {
    // throw new Error('Method not implemented.');
    console.log('[jingdong] Method not supported.');
    const req = this.getRequestHeader('getAgentInfo');
    return Promise.resolve({ ...req } as unknown as T);
  }
  handleResponseMessage<T extends Response>(event: MessageEvent<any>): T {
    const jdRes = JSON.parse(event.data) as JDResponse;
    const { detailinfo, code, key } = jdRes;
    let cmd: CMD;
    //code: 2：批量推送打印，6：获取打印机列表，8：预览 ）
    switch (code) {
      case '2':
        cmd = 'print';
        break;
      case '6':
        cmd = 'getPrinters';
        break;
      case '8':
        cmd = 'PRE_View';
        break;
      default:
        cmd = 'print';
    }
    const res: JsonObject = { ...jdRes, success: Boolean(jdRes.success), msg: jdRes.message, requestID: key, cmd };
    if (cmd === 'getPrinters') {
      res.printers = jdRes.detailinfo?.printers?.map((p) => ({ name: p }));
    }
    return res as unknown as T;
  }
  handleRequestMessage<T extends JsonObject>(jsonData: Request): T {
    const { cmd, version, requestID } = jsonData;
    const reqData: JDRequest = { version, parameters: {}, key: requestID, dataType: 'app' } as unknown as JDRequest;
    switch (cmd) {
      case 'getPrinters':
        reqData.orderType = 'GET_Printers';
        break;
      case 'print':
        reqData.orderType = 'PRINT';
        break;
      case 'PRE_View':
      case 'PRE_View:multi':
        reqData.orderType = cmd;
        break;
      default:
        reqData.orderType = cmd;
        break;
    }
    const task = jsonData.task as PrintTask;
    if (task && task.parameters) {
      const { parameters } = task;
      reqData.parameters = parameters;
    }
    return reqData as unknown as T;
  }
  protected getRequestHeader(cmd: CMD): { cmd: CMD; version: string } {
    return {
      cmd,
      version: this.version || '2',
    };
  }
}

export default JingdongPrinter;
