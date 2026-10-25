const http = require('http');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function httpPut(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'PUT' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

class CDPPage {
  constructor(wsUrl, pageId) {
    this.wsUrl = wsUrl;
    this.pageId = pageId;
    this.ws = null;
    this.msgId = 0;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        } else if (msg.method) {
          const listeners = this.eventListeners.get(msg.method) || [];
          listeners.forEach(fn => fn(msg.params));
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, fn) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(fn);
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception ? res.exceptionDetails.exception.description : res.exceptionDetails.text;
      throw new Error(desc || JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async close() {
    if (this.ws) {
      try { this.ws.close(); } catch(e) {}
    }
    if (this.pageId) {
      try {
        await httpGet(`http://127.0.0.1:9222/json/close/${this.pageId}`);
      } catch(e) {}
    }
  }
}

async function createPage(initialUrl = 'about:blank') {
  const jsonStr = await httpPut(`http://127.0.0.1:9222/json/new?about:blank`);
  const pageInfo = JSON.parse(jsonStr);
  const page = new CDPPage(pageInfo.webSocketDebuggerUrl, pageInfo.id);
  await page.connect();
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('DOM.enable');
  await page.send('Network.enable');
  await page.send('Network.setCacheDisabled', { cacheDisabled: true });
  try {
    await page.send('Storage.clearDataForOrigin', { origin: 'http://localhost:3000', storageTypes: 'cache_storage,service_workers' });
  } catch(e) {}
  if (initialUrl && initialUrl !== 'about:blank') {
    await page.send('Page.navigate', { url: initialUrl });
    await new Promise(r => setTimeout(r, 1200));
  }
  return page;
}

module.exports = { createPage };
