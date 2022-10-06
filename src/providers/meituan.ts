import PrinterProvider, { PrinterProps } from '../printProvider';
import { Response, Request, CMD, JsonObject } from '../interfaces';

const Urls = ['ws://localhost:28613', 'ws://localhost:28713', 'ws://localhost:28813'];
let urlIndex = 0;
const Url = () => {
  return Urls[urlIndex++ % Urls.length];
};
// const Url = 'ws://localhost:28613';
class MeituanPrinter extends PrinterProvider {
  readonly providerKey: string = 'meituan';
  private version: string;
  constructor(props: PrinterProps = { url: Url }) {
    const url = props.url || Url;
    super({ url, options: props.options });
    this.version = props.version || '1.0';
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

export default MeituanPrinter;
