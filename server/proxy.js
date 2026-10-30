/**
 * 本地 CORS 代理 —— 零依赖实现（只用 Node 内置模块，不需要 express / cors）。
 *
 * 用法：
 *   npm run proxy                     # 默认 http://127.0.0.1:8787/proxy
 *   PORT=9000 npm run proxy           # 换端口
 *   HOST=0.0.0.0 npm run proxy        # 允许局域网其它设备访问
 *
 * 前端把请求发到 http://127.0.0.1:8787/proxy，真实目标写在 X-Target-URL 头，
 * 或使用 ?url=<encoded target> 查询参数。HTTP 方法、请求体、响应体全部按原始
 * 字节透传，代理只负责三件事：
 *   1. 补上 CORS 响应头（含 OPTIONS 预检），让浏览器放行；
 *   2. 摘掉 Origin / Referer 等会触发目标站同源校验的请求头；
 *   3. 自己跟随 3xx 重定向（若交给浏览器跟随，重定向后的响应会丢掉 CORS 头）。
 *
 * 因为是字节级透传，form-data 上传、二进制下载、大 JSON 都能正常工作。
 */
import http from 'node:http';
import https from 'node:https';

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const UPSTREAM_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS || 60000);
const MAX_BODY_BYTES = Number(process.env.PROXY_MAX_BODY || 64 * 1024 * 1024);
const MAX_REDIRECTS = 5;

/** hop-by-hop 头不允许跨代理转发（RFC 7230） */
const HOP_BY_HOP = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

/** 发给目标站之前要摘掉的请求头 */
const DROP_REQUEST_HEADERS = new Set([
  ...HOP_BY_HOP,
  'host',
  'content-length',
  'x-target-url',
  'origin', // 浏览器强制带上的跨域来源，目标站 WAF 常据此拦截
  'referer',
  'accept-encoding', // 统一用 identity，避免响应被压缩后无法原样展示
]);

/** 回传给浏览器之前要摘掉的响应头 */
const DROP_RESPONSE_HEADERS = new Set([
  ...HOP_BY_HOP,
  'content-encoding',
  'content-length',
  'set-cookie', // 跨域下浏览器本来就会拒收，去掉更干净
]);

/** 解析目标地址：优先 X-Target-URL 头，其次 ?url= 查询参数 */
function resolveTarget(req, requestUrl) {
  const headerTarget = req.headers['x-target-url'];
  let raw = '';

  if (typeof headerTarget === 'string' && headerTarget.trim()) {
    raw = headerTarget.trim();
  } else if (Array.isArray(headerTarget) && headerTarget[0]) {
    raw = headerTarget[0].trim();
  } else {
    raw = requestUrl.searchParams.get('url') || '';
  }

  if (!raw) return null;
  try {
    raw = decodeURI(raw);
  } catch {
    /* 解码失败就按原样用 */
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 把请求体读成 Buffer（保留原始字节，form-data / 二进制不被破坏） */
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error(`请求体超过上限 ${Math.round(MAX_BODY_BYTES / 1024 / 1024)}MB`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  // 前端用的是 credentials: 'omit'，回显 origin 即可；无 origin（curl）时给 *
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ||
      'Content-Type,Authorization,Accept,X-Target-URL,X-Requested-With',
  );
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * 向目标站发起请求并读取完整响应。
 * @returns {Promise<{status:number, statusText:string, headers:object, body:Buffer}>}
 */
function forward(target, method, headers, body, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    const isHttps = target.protocol === 'https:';
    const transport = isHttps ? https : http;

    const outgoing = {
      ...headers,
      host: target.hostname,
      // 伪装成同源访问：部分站点校验 Referer，缺失时直接 403
      referer: `${target.protocol}//${target.host}/`,
      'accept-encoding': 'identity',
    };
    if (body && body.length > 0) outgoing['content-length'] = String(body.length);

    const upstream = transport.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (isHttps ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        method,
        headers: outgoing,
      },
      (upRes) => {
        const chunks = [];
        upRes.on('data', (c) => chunks.push(c));
        upRes.on('end', () => {
          const status = upRes.statusCode || 0;
          const location = upRes.headers.location;

          // 自己跟随重定向，否则浏览器跟随后的响应会缺少 CORS 头
          if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
            let nextUrl;
            try {
              nextUrl = new URL(location, target);
            } catch {
              resolve({
                status,
                statusText: upRes.statusMessage || '',
                headers: upRes.headers,
                body: Buffer.concat(chunks),
              });
              return;
            }
            // 301/302/303 会把非 GET 请求降级为 GET（与浏览器行为一致）
            const downgrade = status === 301 || status === 302 || status === 303;
            const nextMethod = downgrade && method !== 'GET' && method !== 'HEAD' ? 'GET' : method;
            const nextBody = nextMethod === 'GET' ? Buffer.alloc(0) : body;
            const nextHeaders = { ...headers };
            if (nextMethod === 'GET') {
              delete nextHeaders['content-type'];
              delete nextHeaders['content-length'];
            }
            forward(nextUrl, nextMethod, nextHeaders, nextBody, redirectsLeft - 1).then(
              resolve,
              reject,
            );
            return;
          }

          resolve({
            status,
            statusText: upRes.statusMessage || '',
            headers: upRes.headers,
            body: Buffer.concat(chunks),
          });
        });
        upRes.on('error', reject);
      },
    );

    upstream.setTimeout(UPSTREAM_TIMEOUT_MS, () => {
      upstream.destroy(new Error(`目标站响应超时（${UPSTREAM_TIMEOUT_MS}ms）`));
    });
    upstream.on('error', reject);

    if (body && body.length > 0) upstream.write(body);
    upstream.end();
  });
}

function sendJson(res, status, payload) {
  const text = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
  });
  res.end(text);
}

const server = http.createServer(async (req, res) => {
  applyCors(req, res);

  // 预检请求直接放行，不打到目标站
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Content-Length': '0' });
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`);

  // 健康检查：前端或脚本可用它确认代理是否活着
  if (requestUrl.pathname === '/health') {
    sendJson(res, 200, { ok: true, service: 'postman-web-proxy', port: PORT, uptime: Math.round(process.uptime()) });
    return;
  }

  const target = resolveTarget(req, requestUrl);
  if (!target) {
    sendJson(res, 400, {
      error: '缺少目标地址',
      hint: '请带上 X-Target-URL: <完整目标 URL> 请求头，或使用 ?url=<encoded> 查询参数',
    });
    return;
  }

  const startedAt = Date.now();

  try {
    const body = await readRequestBody(req);

    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (DROP_REQUEST_HEADERS.has(key.toLowerCase())) continue;
      forwardHeaders[key] = value;
    }

    const result = await forward(target, (req.method || 'GET').toUpperCase(), forwardHeaders, body);

    for (const [key, value] of Object.entries(result.headers)) {
      if (value === undefined) continue;
      if (DROP_RESPONSE_HEADERS.has(key.toLowerCase())) continue;
      res.setHeader(key, value);
    }
    // 前端会过滤掉以 x-proxy- 开头的头，这里补上便于排查
    res.setHeader('X-Proxy-Duration', `${Date.now() - startedAt}ms`);
    res.setHeader('X-Proxy-Target', target.href);
    res.setHeader('Content-Length', String(result.body.length));

    console.log(`${req.method} ${result.status} ${Date.now() - startedAt}ms  ${target.href}`);

    res.writeHead(result.status);
    res.end(result.body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${req.method} 502 ${Date.now() - startedAt}ms  ${target.href}\n  ${message}`);
    sendJson(res, 502, {
      error: '代理转发失败',
      message,
      code: err && typeof err === 'object' && 'code' in err ? err.code : null,
      target: target.href,
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Postman Web 代理已启动: http://${HOST}:${PORT}/proxy`);
  console.log(`  健康检查:               http://${HOST}:${PORT}/health`);
  console.log(`  在前端「设置 → 代理地址」填上面这个 /proxy 地址即可。\n`);
});
