import EcPrinter, { Providers, PrintProvider, SocketOption, DerivedProvider } from 'ec-print';
import { App, computed, inject, InjectionKey, Plugin, reactive, Ref, ref, unref } from 'vue';
const __DEV__ = import.meta.env.DEV;
declare module 'vue' {
  interface ComponentCustomProperties {
    $printer: typeof EcPrinter;
  }
}
interface IPrinter {
  instance: EcPrinter;
  install(app: App): void;
}
interface PrinterOptions {
  providers: Array<{
    key?: string;
    providerFactory: DerivedProvider | (() => PrintProvider);
    socketOption?: SocketOption;
  }>;
  socketOption?: SocketOption;
}
interface PrinterStatus {
  [k: string]: boolean;
}
const printerKey = Symbol(__DEV__ ? 'ec-printer' : '') as InjectionKey<EcPrinter>;
const printerStatusKey = Symbol(__DEV__ ? 'ec-printer-status' : '') as InjectionKey<Ref<PrinterStatus>>;
const allProviders = Object.keys(Providers).map((p) => {
  return {
    key: p.toLowerCase(),
    providerFactory: (Providers as { [k: string]: DerivedProvider })[p],
    options: {},
  };
});
const _defaultOptions: PrinterOptions = {
  providers: allProviders,
  socketOption: {
    autoReconnect: true,
  },
};
const printerStatusRef = ref<PrinterStatus>({});

export function createPrinter(options: PrinterOptions): IPrinter {
  const printer = new EcPrinter();
  const _opts = _defaultOptions;
  if (options) {
    _opts.providers = options.providers && options.providers.length ? options.providers : _defaultOptions.providers;
    _opts.socketOption = { ..._opts.socketOption, ...(options.socketOption || {}) };
  }
  _opts.providers.forEach((provider) => {
    let agent;
    // typeof class extends PrintProvider
    if (provider.providerFactory.prototype.print) {
      const construct = provider.providerFactory as DerivedProvider;
      agent = new construct({
        options: { ...provider.socketOption, ..._opts.socketOption },
      });
    } else {
      agent = (provider.providerFactory as () => PrintProvider)();
    }
    const key = provider.key ?? agent.providerKey;
    agent.addEventListener('open', (e) => {
      printerStatusRef.value[key] = true;
    });
    agent.addEventListener('close', (e) => {
      // console.log('agent on close>>>', key);
      printerStatusRef.value[key] = false;
    });
    printer.registerOne(key, agent);
  });

  function install(app: App) {
    app.config.globalProperties['$printer'] = printer;
    Object.defineProperty(app.config.globalProperties, '$printer_connect_status', {
      enumerable: true,
      get: () => unref(printerStatusRef),
    });
    app.provide(printerKey, printer);

    app.provide(printerStatusKey, reactive(printerStatusRef));
    const unmountApp = app.unmount;
    app.unmount = function () {
      printer?.disconnect();
      unmountApp();
    };
  }
  return { instance: printer, install };
}

export function usePrinter(): EcPrinter {
  return inject(printerKey)!;
}
export function usePrinterConnectStatus() {
  return inject(printerStatusKey)!;
}
