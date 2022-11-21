import ReconnectingWebSocket, {
  Options,
  CloseEvent,
  ErrorEvent,
  Event,
  UrlProvider as RWSUrlProvider,
} from 'reconnecting-websocket';
import { Request, Response, IPrinter, JsonObject, PrinterConfig, PrintTask, CMD } from './interfaces';
import getUUID from './uuid';
type FlattenArrayType<T> = T extends any[] ? T[number] : T;
// type NoNullable<T> = T extends null | undefined ? never : T;

interface RequestTask {
  data: { requestID: string; [k: string]: any };
  callback: (res: Response) => void;
  start: boolean;
}
export type NotifyResultCallback = <T extends Response>(response: T) => void | T;
export interface CallbackMap {
  open?: (value: boolean | PromiseLike<boolean>) => void;
  error?: (value: boolean | PromiseLike<boolean>) => void;
}
export type PrinterListenersMap = {
  close: Array<(event: CloseEvent) => void>;
  error: Array<(event: ErrorEvent) => void>;
  // message: (event: MessageEvent) => void;
  open: Array<(event: Event) => void>;
};
export interface PrinterProps {
  url?: UrlProvider;
  options?: SocketOption;
  version?: string;
}
export interface SocketOption extends Options {
  /**
   * if true attempt to reconnect when send message to ws
   * @default true
   */
  autoReconnect?: boolean;
}
export type UrlProvider = RWSUrlProvider;
export default abstract class PrinterProvider implements IPrinter {
  private ws?: ReconnectingWebSocket;
  private url?: UrlProvider;
  private options: SocketOption = {
    autoReconnect: true,
  };
  private _debug(...args: any[]) {
    if (this.options.debug) {
      console.log.apply(console, ['ECPRINT>', ...args]);
    }
  }
  private readonly $requestQueue: Array<RequestTask> = [];
  private readonly $notifyPrintResultListener: Array<NotifyResultCallback> = [];
  private readonly $callback: CallbackMap = {
    open: undefined,
    error: undefined,
  };
  private readonly _listeners: PrinterListenersMap = {
    error: [],
    open: [],
    close: [],
  };
  constructor(props: PrinterProps = { url: '' }) {
    const { url, options = {} } = props;
    this.url = url;
    this.options = { ...this.options, ...(options || {}) };
  }
  get isConnect() {
    return this.ws?.readyState === this.ws?.OPEN;
  }
  abstract readonly providerKey: string;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: ErrorEvent) => void) | null = null;
  public onopen: ((event: Event) => void) | null = null;
  private _connectLock = false;
  connect() {
    if (!this.url) {
      throw Error('url is required!');
    }
    if (this._connectLock) {
      return Promise.resolve(true);
    }
    this._connectLock = true;
    if (!this.ws || this.ws.readyState === this.ws.CLOSED) {
      this.ws = new ReconnectingWebSocket(this.url, undefined, this.options);
    }
    this.ws.addEventListener('message', (event) => {
      this._onMessage(event);
    });
    this.ws?.addEventListener('open', (event) => {
      this._handleOpen(event);
    });
    this.ws.addEventListener('error', (event) => {
      this._handleError(event);
    });
    this.ws.addEventListener('close', (event) => {
      this._handleClose(event);
    });
    return new Promise<boolean>((resolve) => {
      this._addCallback('open', (evt) => {
        this._connectLock = false;
        resolve(evt);
      });
      this._addCallback('error', (evt) => {
        this._connectLock = false;
        resolve(evt);
      });
    });
  }
  private _handleOpen(event: Event) {
    this.startRequest();
    this._dispatchCallback('open', [true]);
    if (this.onopen) {
      this.onopen(event);
    }
    this._listeners.open.forEach((listener) => listener(event));
  }
  private _handleError(event: ErrorEvent) {
    this._debug('connect error', this.url, event.message);
    this._dispatchCallback('error', [false]);
    if (this.onerror) {
      this.onerror(event);
    }
    this._listeners.error.forEach((listener) => listener(event));
  }
  private _handleClose(event: CloseEvent) {
    this._debug(`connect closed url[${this.url}],code:${event.code},reason:${event.reason}`);
    this.$requestQueue.forEach((req) => {
      req.start = false;
    });
    if (this.onclose) {
      this.onclose(event);
    }
    this._listeners.close.forEach((listener) => listener(event));
  }
  reconnect() {
    this.disconnect(1000, 'reconnect');
    return this.connect();
  }
  disconnect(code = 0, reason?: string) {
    this.ws?.close(code, reason || 'destroyed');
    Object.keys(this.$callback).forEach((k: string) => (this.$callback[k as keyof CallbackMap] = undefined));
    this.$notifyPrintResultListener.splice(0);
    this.$requestQueue.splice(0);
    this._removeListners();
  }
  private _removeListners() {
    this.onclose = null;
    this.onerror = null;
    this.onopen = null;
    this.removeEventListener('close');
    this.removeEventListener('open');
    this.removeEventListener('error');
  }
  private _addCallback<T extends keyof CallbackMap>(type: T, handler: CallbackMap[T]) {
    this.$callback[type] = handler;
  }
  private _dispatchCallback<T extends keyof CallbackMap>(type: T, event: Parameters<Required<CallbackMap>[T]>) {
    const method = this.$callback[type];
    if (typeof method === 'function') {
      method.apply(method, event);
    }
    this.$callback[type] = undefined;
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

  public addEventListener<T extends keyof PrinterListenersMap>(
    type: T,
    listener: FlattenArrayType<PrinterListenersMap[T]>
  ): void {
    if (this._listeners[type]) {
      this._listeners[type].push(listener as any);
    }
  }
  public removeEventListener<T extends keyof PrinterListenersMap>(
    type: T,
    listener?: FlattenArrayType<PrinterListenersMap[T]>
  ): void {
    if (this._listeners[type]) {
      if (!listener) {
        this._listeners[type] = [];
        return;
      }
      // @ts-ignore
      this._listeners[type] = this._listeners[type].filter((l) => l !== listener);
    }
  }

  /**
   * 子类中实现该方法用于将 平台打印组件返回的消息 解析成统一的协议格式
   * @param event
   */
  abstract handleResponseMessage<T extends Response>(event: MessageEvent): T;

  /**
   * 子类中实现该方法用于将 标准标准数据 解析成不同打印组件的协议格式
   * @param jsonData
   */
  abstract handleRequestMessage<T extends JsonObject>(jsonData: { [k: string]: any }): T;

  /**
   * 打印组件调用的统一入口
   * @param jsonData
   * @returns
   */
  async request(jsonData: Omit<Request, 'requestID'>) {
    const requestID = getUUID();
    const { options, isConnect } = this;
    if (!isConnect && options.autoReconnect) {
      const success = await this.connect();
      if (!success) {
        return Promise.resolve({
          requestID,
          cmd: jsonData.cmd,
          success: false,
          status: 'failed',
          msg: 'connect error',
          errorCode: 1000,
        });
      }
    }
    return new Promise((resolve) => {
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
  protected getRequestHeader(cmd: CMD) {
    return {
      cmd,
      version: '1.0',
    };
  }
  print<T extends Response>(task: PrintTask): Promise<T> {
    const req = this.getRequestHeader('print');
    return this.request({ ...req, task: { ...task, preview: false } }) as Promise<T>;
  }
  printPreview<T extends Response>(task: PrintTask): Promise<T> {
    const req = this.getRequestHeader('print');
    return this.request({ ...req, task: { ...task, preview: true } }) as Promise<T>;
  }
  getPrinters<T extends Response>(): Promise<T> {
    const req = this.getRequestHeader('getPrinters');
    return this.request({ ...req }) as Promise<T>;
  }
  getPrinterConfig<T extends Response>(printer: string): Promise<T> {
    const req = this.getRequestHeader('getPrinterConfig');
    return this.request({ ...req, printer }) as Promise<T>;
  }
  setPrinterConfig<T extends Response>(config: PrinterConfig): Promise<T> {
    const req = this.getRequestHeader('setPrinterConfig');
    return this.request({ ...req, printer: config }) as Promise<T>;
  }
  notifyPrintResult(callback: <T extends Response>(response: T) => void): void {
    if (typeof callback === 'function' && !this.$notifyPrintResultListener.includes(callback)) {
      this.$notifyPrintResultListener.push(callback);
    }
  }
  getTaskStatus<T extends Response>(taskID: string[]): Promise<T> {
    const req = this.getRequestHeader('getTaskStatus');
    return this.request({ ...req, taskID }) as Promise<T>;
  }
  getGlobalConfig<T extends Response>(): Promise<T> {
    const req = this.getRequestHeader('getGlobalConfig');
    return this.request({ ...req }) as Promise<T>;
  }
  setGlobalConfig<T extends Response>(config: { notifyOnTaskFailure?: boolean | undefined }): Promise<T> {
    const req = this.getRequestHeader('setGlobalConfig');
    return this.request({ ...req, ...config }) as Promise<T>;
  }
  getAgentInfo<T extends Response>(): Promise<T> {
    const req = this.getRequestHeader('getAgentInfo');
    return this.request({ ...req }) as Promise<T>;
  }
}
