import Printer, { Providers, Response } from '../../src';
import WebSocket from 'ws';
const url = 'ws://localhost:13528';

const cainiao = new Providers.Cainiao({
  options: {
    WebSocket,
    // maxRetries: 2,
    debug: true,
  },
});
const doudian = new Providers.Doudian({
  options: {
    WebSocket,
    // maxRetries: 2,
    debug: true,
  },
});
const printer = new Printer();
printer.register([
  { key: cainiao.providerKey, provider: cainiao },
  { key: doudian.providerKey, provider: doudian },
]);
printer.allAgents.forEach((a) => {
  a.addEventListener('close', (e) => {
    console.log(`${a.providerKey} printer connect closed`, e.reason, e.code);
  });
});
const cainiao_print_task = {
  _agentKey: 'cainiao',
  taskID: '7293666',
  preview: false,
  printer: '',
  previewType: 'pdf',
  firstDocumentNumber: 10,
  totalDocumentCount: 100,
  documents: [
    {
      documentID: '0123456789',
      contents: [
        {
          data: {
            nick: '张三',
          },
          templateURL: 'http://cloudprint.cainiao.com/template/standard/278250/1',
        },
      ],
    },
  ],
};
const douyin_print_task = {
  taskID: '7293666',
  // printer: '打印机',
  // preview: false,
  documents: [
    {
      documentID: '01234567891',
      contents: [
        {
          data: {
            nick: '张三',
          },
          templateURL: '',
        },
      ],
    },
  ],
};
async function run() {
  const connected = await printer.connect();
  console.log('connected', connected);
  const version = await printer.getAgentInfo('cainiao');
  console.log('version', version);
  const res1 = await printer.print<Response>(cainiao_print_task);
  console.log('cainiao print response', res1);
  const res2 = await printer.print(douyin_print_task, 'doudian');
  console.log('douyin print response', res2);
}

run();

setInterval(() => {
  console.log(new Date().getTime(), printer.isConnect);
}, 10000 * Math.random());
