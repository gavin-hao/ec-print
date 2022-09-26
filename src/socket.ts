// import { IPrinter } from './interfaces';

// export interface SocketOption {
//   /**
//    * if true attempt to reconnect
//    * @default true
//    */
//   autoReconnect?: boolean;
//   /**
//    * The number of milliseconds to delay before attempting to reconnect
//    * @default 1000
//    */
//   reconnectInterval?: number;
//   /**
//    *  The maximum number of reconnection attempts to make. Unlimited if 0|undefined .
//    * @default 3
//    */
//   maxReconnectAttempts?: number;
//   /**
//    * The maximum time in milliseconds to wait for a connection to succeed before closing and retrying.
//    * @default 2000
//    */
//   timeoutInterval: 2000;
// }

// export abstract class Socket {
//   private readonly $events: Record<string, any[]> = {
//     open: [],
//     message: [],
//     error: [],
//     close: [],
//   };
//   private ws?: WebSocket = undefined;
//   private url?: string;
//   private option: SocketOption = {
//     autoReconnect: true,
//     reconnectInterval: 1000,
//     maxReconnectAttempts: 3,
//   };
//   constructor(url: string, option: SocketOption = {}) {
//     this.url = url;
//     this.option = { ...this.option, ...option };
//   }
//   connect() {
//     if (!this.url) {
//       throw Error('url is required!');
//     }
//     if (!this.ws) {
//       const ws = new WebSocket(this.url);
//       ws.onopen = (e) => {
//         this.dispatchEvent('open', e);
//       };
//       ws.onmessage = (e) => {
//         this.dispatchEvent('message', e);
//       };
//       ws.onerror = (e) => {
//         this.dispatchEvent('error', e);
//         if (this.ws === ws) {
//           this.ws = null;
//           this.reconnect();
//         }
//       };
//       ws.onclose = (e) => {
//         this.dispatchEvent('close', e);
//         if (this.ws === ws) {
//           this.ws = null;
//           this.reconnect();
//         }
//       };
//     }
//   }
//   reconnect() {
//     const { ws } = this;
//     const { reconnectInterval, maxReconnectAttempts: maxRetry, autoReconnect } = this.option;

//     if (!ws && autoReconnect) {
//       setTimeout(() => {
//         this.connect();
//       }, reconnectInterval);
//     }
//   }
//   addEventListener(type: string, callback: Function) {
//     if (typeof callback === 'function' && this.$events[type] && !this.$events[type].includes(callback)) {
//       this.$events[type].push(callback);
//     }
//   }

//   removeEventListener(type: string, callback: Function) {
//     const index = (this.$events[type] || []).indexOf(callback);
//     if (index > -1) {
//       this.$events[type].splice(index, 1);
//     }
//   }
//   abstract onerror(): void;
//   abstract onmessage(): void;
//   abstract on(): void;
//   abstract onerror(): void;
//   dispatchEvent(type: string, event: Event) {
//     const method = `on${type}`;
//     if (typeof this[method] === 'function') this[method](event);

//     const callbacks = this.$events[type] || [];
//     for (const callback of callbacks) {
//       callback(event);
//     }
//   }
// }
