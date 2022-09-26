import ReconnectingWebSocket, { Options } from 'reconnecting-websocket';
import { RequestHeader, ResponseHeader } from './interfaces';
import getUUID from './uuid';

// interface TaskData {
//   requestId: string;
//   cmd:
//   [x: string]: any;
// }
interface RequestTask {
  data: { requestID: string; [k: string]: any };
  callback: (res: ResponseHeader) => void;
  start: boolean;
}
type NotifyResultCallback = <T>(response: T) => void | T;
interface ListenerMap {
  open?: (value: boolean | PromiseLike<boolean>) => void;
  error?: (value: boolean | PromiseLike<boolean>) => void;
}
export interface SocketOption extends Options {
  /**
   * if true attempt to reconnect
   * @default true
   */
  autoReconnect?: boolean;
}
export default abstract class BasePrinter {
  private ws?: ReconnectingWebSocket;
  private url?: string;
  private options: SocketOption = {
    maxRetries: 2,
  };
  private _debug(...args: any[]) {
    if (this.options.debug) {
      console.log.apply(console, ['ECPRINT>', ...args]);
    }
  }
  private readonly $requestQueue: Array<RequestTask> = [];
  private readonly $notifyPrintResultListener: Array<NotifyResultCallback> = [];
  private readonly $listeners: ListenerMap = {
    open: undefined,
    error: undefined,
  };
  // private $openCallback?: (value: boolean | PromiseLike<boolean>) => void;
  constructor(url: string, options: SocketOption = {}) {
    this.url = url;
    this.options = { ...this.options, ...(options || {}) };
  }
  get isConnect() {
    return this.ws?.readyState === this.ws?.OPEN;
  }
  connect() {
    if (!this.url) {
      throw Error('url is required!');
    }
    if (!this.ws || this.ws.readyState === this.ws.CLOSED) {
      this.ws = new ReconnectingWebSocket(this.url, undefined, this.options);
    }
    this.ws.addEventListener('message', (event) => {
      this._onMessage(event);
    });
    this.ws?.addEventListener('open', (event) => {
      this.startRequest();
      this._dispatchCallback('open', [true]);
    });
    this.ws.addEventListener('error', (err) => {
      this._debug('connect error', this.url, err.message);
      this._dispatchCallback('error', [false]);
    });
    this.ws.addEventListener('close', (event) => {
      this._debug(`connect closed url[${this.url}],code:${event.code},reason:${event.reason}`);
      this.$requestQueue.forEach((req) => {
        req.start = false;
      });
    });
    return new Promise<boolean>((resolve) => {
      this._addCallback('open', resolve);
      this._addCallback('error', resolve);
    });
  }
  private _addCallback<T extends keyof ListenerMap>(type: T, handler: ListenerMap[T]) {
    this.$listeners[type] = handler;
  }
  private _dispatchCallback<T extends keyof ListenerMap>(type: T, event: Parameters<Required<ListenerMap>[T]>) {
    const method = this.$listeners[type];
    if (typeof method === 'function') {
      method.apply(method, event);
    }
    this.$listeners[type] = undefined;
  }
  private _onMessage(event: MessageEvent) {
    this._debug('receive message', event.data);
    const response = this.handleResponseMessage(event);
    const index = this.$requestQueue.findIndex((req) => req.data.requestID === response.requestID);
    if (index > -1) {
      this.$requestQueue[index].callback(response);
      this.$requestQueue.splice(index, 1);
    }
    if (response.cmd === 'notifyPrintResult') {
      this.$notifyPrintResultListener.forEach((callback) => {
        callback(response);
      });
    }
  }
  abstract handleResponseMessage<T extends ResponseHeader>(event: MessageEvent): T;

  /**
   * 子类中实现该方法用于将 标准标准数据 解析成不同打印组件的协议格式
   * @param jsonData
   */
  abstract handleRequestMessage<T extends { [k: string]: any }>(jsonData: { [k: string]: any }): T;

  /**
   * 打印结果通知
   * @param callback
   */
  notifyPrintResult(callback: <T>(response: T) => void) {
    if (typeof callback === 'function' && !this.$notifyPrintResultListener.includes(callback)) {
      this.$notifyPrintResultListener.push(callback);
    }
  }
  /**
   * 打印组件调用的统一入口
   * @param jsonData
   * @returns
   */
  request(jsonData: Omit<RequestHeader, 'requestID'>) {
    const requestID = getUUID();
    return new Promise<ResponseHeader>((resolve) => {
      this.$requestQueue.push({
        data: {
          ...jsonData,
          requestID,
        },
        callback: resolve,
        start: false,
      });
      this.startRequest();
    });
  }
  async startRequest() {
    const { ws, $requestQueue } = this;
    if (!ws || ws.readyState === ws.CLOSED) {
      await this.connect();
    }
    if (ws && $requestQueue.length > 0) {
      for (const req of $requestQueue) {
        if (!req.start) {
          const message = this.handleRequestMessage(req.data);
          ws.send(JSON.stringify(message));
          req.start = true;
        }
      }
    }
  }
  disconnect() {
    this.ws?.close(0, 'destried');
  }
}
