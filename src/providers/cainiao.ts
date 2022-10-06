import PrinterProvider, { PrinterProps } from '../printProvider';
import { Response, Request, CMD, JsonObject } from '../interfaces';

const Url = 'ws://localhost:13528';
class CainiaoPrinter extends PrinterProvider {
  readonly providerKey: string = 'cainiao';
  private version: string;
  constructor(props: PrinterProps = { url: Url }) {
    const url = props.url || Url;
    super({ url, options: props.options });
    this.version = props.version || '1.0';
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
