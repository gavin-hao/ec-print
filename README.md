# ec-print
All in one print toolkit for e-commerce ，integrated cainiao,pinduouo,jingdong,kuaishou,douyin ...

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](https://commitizen.github.io/cz-cli/)
[![Continuous Deployment](https://github.com/gavin-hao/ec-print/actions/workflows/cd.yml/badge.svg)](https://github.com/gavin-hao/ec-print/actions/workflows/cd.yml)
![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fgavin-hao%2Fec-print.svg?type=shield)
[![GitHub license](https://img.shields.io/github/license/gavin-hao/ec-print)](https://github.com/gavin-hao/ec-print/blob/master/LICENSE)

---

# Platform supports & Docs
- [菜鸟](https://open.taobao.com/doc.htm?docId=107014&docType=1)
- [拼多多](https://open.pinduoduo.com/application/document/browse?idStr=3BBB4C229B6A8FCC)
- [京东](https://cloud.jdl.com/#/open-business-document/access-guide/157/54222)
- [快手](https://docs.qingque.cn/d/home/eZQA41D2h9LGUFaD26bC07e--?identityId=EmukFTnlEF#section=h.fspyixibo86k)
- [抖音](https://bytedance.feishu.cn/docx/doxcn1Q29qB2M3HKzjK5uaMbsMb)
- [美团](https://opendj.meituan.com/home/guide/bulkPurchasing/10721)

# dependences
- [reconnecting-websocket](https://github.com/pladaria/reconnecting-websocket)
# Quickstart

#### install
```bash
yarn add ec-print
```
#### use in your project

```typescript
import Printer,{Providers} from 'ec-print';

const cainiao = new Providers.Cainiao(undefined, {
  WebSocket,
  // maxRetries: 2,
  debug: true,
});
const doudian = new Providers.Doudian(undefined, {
  WebSocket,
  debug: true,
});
const printer = new Printer();
printer.register([
  { key: cainiao.providerKey, provider: cainiao },
  { key: doudian.providerKey, provider: doudian },
]);
async run(){
  const connected = await printer.connect();
  console.log('connected', connected);
  const version = await printer.getAgentInfo('cainiao');
  console.log('version', version);
  const res1 = await printer.print<Response>(cainiao_print_task);
  console.log('cainiao print response', res1);
  const res2 = await printer.print(douyin_print_task, 'doudian');
  console.log('douyin print response', res2);
}


```
# features
### Auto reconnect
see [reconnecting-websocket](https://github.com/pladaria/reconnecting-websocket)

#### options
```
type SocketOptions = {
    WebSocket?: any; // WebSocket constructor, if none provided, defaults to global WebSocket
    maxReconnectionDelay?: number; // max delay in ms between reconnections
    minReconnectionDelay?: number; // min delay in ms between reconnections
    reconnectionDelayGrowFactor?: number; // how fast the reconnection delay grows
    minUptime?: number; // min time in ms to consider connection as stable
    connectionTimeout?: number; // retry connect if not connected after this time, in ms
    maxRetries?: number; // maximum number of retries
    maxEnqueuedMessages?: number; // maximum number of messages to buffer until reconnection
    startClosed?: boolean; // start websocket in CLOSED state, call `.reconnect()` to connect
    debug?: boolean; // enables debug output
    autoReconnect?: boolean; //if true attempt to reconnect when send message to ws
};
``` 

### custom printer provider

``` typescript
import { PrinterProvider, PrinterProps} from 'ec-printer';
class CustomPrinter extends PrinterProvider {
  readonly providerKey: string = 'yourKey';
  private version: string;
  constructor(props: PrinterProps = { url: 'ws://localhost:1111' }) {
    const url = props.url;
    super({ url, options: props.options });
    this.version = props.version || '1.0';
  }
  // implement abstract methods handleResponseMessage and handleRequestMessage
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
```
then

```typescript
const printer = new Printer();
printer.register([
  { key: cainiao.providerKey, provider: cainiao },
  { key: 'providerKey', provider: new CustomPrinter() },
]);

printer.connect().then(res=>{
  printer.getPrinter('providerKey')
})
```
# Demos

[nodejs-example](./example/src/index.ts)
[vue3-example](./example-vue/src/main.ts)
# License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fgavin-hao%2Fec-print.svg?type=large)](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fgavin-hao%2Fec-print.svg?type=badge_large)
# Analytics
![Alt](https://repobeats.axiom.co/api/embed/37ddec86d454d3ce382cdcb4c5090417bfe57a09.svg "Repobeats analytics image")
