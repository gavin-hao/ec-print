import Cainiao from './providers/cainiao';
import Pinduoduo from './providers/pinduoduo';
import Jingdong from './providers/jingdong';
import Kuaishou from './providers/kuaishou';
import Meituan from './providers/meituan';
import Doudyin from './providers/douyin';
import PrintProvider, { PrinterProps } from './printProvider';
import Printer from './printer';
export { Cainiao, Pinduoduo, Kuaishou, Doudyin, Meituan, Jingdong };
export { default as getUUID } from './uuid';

export { CloseEvent, ErrorEvent, Event } from 'reconnecting-websocket';
export * from './interfaces';
export {
  default as PrintProvider,
  SocketOption,
  UrlProvider,
  NotifyResultCallback,
  CallbackMap,
  PrinterListenersMap,
  PrinterProps,
} from './printProvider';
export type DerivedProvider = { new (args: PrinterProps): PrintProvider };
export const Providers: { [k: string]: DerivedProvider } = {
  Cainiao,
  Pinduoduo,
  Jingdong,
  Kuaishou,
  Meituan,
  Doudian: Doudyin,
};

export default Printer;
