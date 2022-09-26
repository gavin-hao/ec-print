import CainiaoPrinter from '../../src/cainiao';
import WebSocket from 'ws';
const url = 'ws://localhost:13528';

const printer = new CainiaoPrinter(url, {
  WebSocket,
  debug: true,
});

const task = {
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
async function run() {
  const connected = await printer.connect();
  console.log('connected', connected);
  const version = await printer.getAgentInfo();
  console.log('version', version);
  const res = await printer.print(task);
  console.log('print response', res);
  printer.getTaskStatus([task.taskID]);
}

run();
setInterval(() => {
  printer.print(task);
}, 10000 * Math.random());
