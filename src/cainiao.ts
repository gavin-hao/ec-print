import BasePrinter, { SocketOption } from './basePrint';
import { ResponseHeader, RequestHeader } from './interfaces';

const Url = 'ws://localhost:13528';
class CainiaoPrinter extends BasePrinter {
  constructor(url: string = Url, options: SocketOption = {}) {
    super(url, options);
  }
  handleResponseMessage<T extends ResponseHeader>(event: MessageEvent<any>): T {
    const res = JSON.parse(event.data);
    return res as unknown as T;
  }
  handleRequestMessage<T extends { [k: string]: any }>(jsonData: RequestHeader): T {
    return jsonData as unknown as T;
  }
  async getPrinters() {
    const requestData = {
      cmd: 'getPrinters',
      version: '1.0',
      // requestID,
    };
    return this.request(requestData);
  }
  getPrinterConfig(printer: string) {
    return this.request({ cmd: 'getPrinterConfig', printer });
  }
  setPrinterConfig(printer: string) {
    return this.request({ cmd: 'setPrinterConfig', printer });
  }
  print(task: any) {
    return this.request({ cmd: 'print', task });
  }
  // /**
  //  * 监听打印通知
  //  * @param callback: function ({printer, taskID, taskStatus, printStatus})=>{ }
  //  */
  // notifyPrintResult(callback) {
  //   if (typeof callback === 'function' && !this.$notifyPrintResult.includes(callback)) {
  //     this.$notifyPrintResult.push(callback);
  //   }
  // }

  /**
   * 获取任务打印任务状态
   * @param taskID : array
   * @returns {Promise<{printStatus: []}>}
   */
  getTaskStatus(taskID: string[]) {
    return this.request({ cmd: 'getTaskStatus', taskID });
  }
  getGlobalConfig() {
    return this.request({ cmd: 'getGlobalConfig' });
  }
  setGlobalConfig({ notifyOnTaskFailure = false }) {
    return this.request({ cmd: 'setGlobalConfig', notifyOnTaskFailure });
  }
  getAgentInfo() {
    return this.request({ cmd: 'getAgentInfo' });
  }
}

export default CainiaoPrinter;
