// server/polyfill.ts
import fetch, { Headers, Request, Response } from 'node-fetch';

if (!globalThis.fetch) {
  globalThis.fetch = fetch as any;
  globalThis.Headers = Headers as any;
  globalThis.Request = Request as any;
  globalThis.Response = Response as any;
  console.log('[Polyfill] Global fetch and Headers registered successfully for Node 16.');
}

if (!globalThis.WebSocket) {
  globalThis.WebSocket = class {} as any;
  console.log('[Polyfill] Global WebSocket stub registered for Node 16.');
}
