import PrinterProvider, { SocketOption, UrlProvider } from '../printProvider';
import { Response, Request, CMD, JsonObject } from '../interfaces';

const Url = 'ws://localhost:13528';
class CainiaoPrinter extends PrinterProvider {
  readonly providerKey: string = 'cainiao';
  private version: string;
  constructor(url: UrlProvider = Url, options: SocketOption = {}, version: string = '1.0') {
    url = url || Url;
    super(url, options);
    this.version = version;
  }
  handleResponseMessage<T extends Response>(event: MessageEvent<any>): T {
    const res = JSON.parse(event.data);
    let success = true;
    if (res.status) {
      success = res.status === 'success';
    }
    return { ...res, success } as unknown as T;
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

export default CainiaoPrinter;
