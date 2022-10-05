import PrinterProvider, { SocketOption, UrlProvider } from '../printProvider';
import { Response, Request, CMD, JsonObject } from '../interfaces';

const Url = 'ws://localhost:16888/ks/printer';
class KuaishouPrinter extends PrinterProvider {
  readonly providerKey: string = 'kuaishou';
  private version: string;
  constructor(url: UrlProvider = Url, options: SocketOption = {}, version: string = '1.0') {
    url = url || Url;
    super(url, options);
    this.version = version;
  }
  handleResponseMessage<T extends Response>(event: MessageEvent<any>): T {
    const res = JSON.parse(event.data);
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

export default KuaishouPrinter;
