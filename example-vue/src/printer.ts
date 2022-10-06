import { createPrinter } from './plugin';

const printer = createPrinter({
  providers: [],
  socketOption: {
    autoReconnect: true,
    maxRetries: 2,
    debug: true,
  },
});
printer.instance.connect();

export default printer;
