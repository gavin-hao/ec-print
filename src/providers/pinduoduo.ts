import PrinterProvider, { SocketOption, UrlProvider } from '../printProvider';
import { Response, Request, CMD, JsonObject } from '../interfaces';

const Url = 'ws://127.0.0.1:5000';
// ws://127.0.0.1:5000；wss://127.0.0.1:18653
class PinduoduoPrinter extends PrinterProvider {
  readonly providerKey: string = 'pinduoduo';
  private version: string;
  constructor(url: UrlProvider = Url, options: SocketOption = {}, version: string = '1.0') {
    url = url || Url;
    super(url, options);
    this.version = version;
  }
  handleResponseMessage<T extends Response>(event: MessageEvent<any>): T {
    const res = JSON.parse(event.data);
    if (res.cmd === 'PrintResultNotify') {
      res.cmd = 'notifyPrintResult';
    }
    return res as unknown as T;
  }
  handleRequestMessage<T extends JsonObject>(jsonData: Request): T {
    return jsonData as unknown as T;
  }
  protected getRequestHeader(cmd: CMD): { cmd: CMD; version: string } {
    return {
      cmd,
      version: this.version || '1.0',
    };
  }
}

export default PinduoduoPrinter;
