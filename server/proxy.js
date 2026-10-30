/**
 * 本地 CORS 代理 —— 仅用于本地开发 / 自托管。
 *
 * 用法：
 *   npm run proxy                     # 默认 http://localhost:8787
 *   PORT=9000 npm run proxy
 *
 * 前端把请求发到 http://localhost:8787/proxy，真实目标写在 X-Target-URL 头，
 * 或使用 ?url=<encoded target> 查询参数。
 *
 * 这是一个「透传型」代理：不解析、不改写请求体和响应体，只负责补上 CORS 头，
 * 因此 form-data / 二进制上传 / 流式响应都能正常工作。
 */
import express from 'express';

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const app = express();

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const DROP_REQUEST_HEADERS = new Set([
  ...HOP_BY_HOP,
  'host',
  'origin',
  'referer',
  'x-target-url',
  'content-length',
  'accept-encoding',
]);

const DROP_RESPONSE_HEADERS = new Set([...HOP_BY_HOP, 'content-encoding', 'content-length', 'set-cookie']);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ||
      'Content-Type,Authorization,Accept,X-Target-URL,X-Requested-With',
  );
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'postman-web-proxy', port: PORT, ts: Date.now() });
});

app.all('/proxy', express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
  const target = (req.headers['x-target-url'] || req.query.url || '').toString();
  if (!target) {
    res.status(400).json({ error: '缺少目标地址：请通过 X-Target-URL 头或 ?url= 传入' });
    return;
  }

  let url;
  try {
    url = new URL(target);
  } catch {
    res.status(400).json({ error: `目标地址不合法: ${target}` });
    return;
  }
  if (!/^https?:$/.test(url.protocol)) {
    res.status(400).json({ error: '仅支持 http/https 目标' });
    return;
  }

  const headers = {};
  Object.entries(req.headers).forEach(([key, value]) => {
    if (DROP_REQUEST_HEADERS.has(key.toLowerCase())) return;
    if (typeof value === 'string') headers[key] = value;
    else if (Array.isArray(value)) headers[key] = value.join(', ');
  });

  const hasBody = Buffer.isBuffer(req.body) && req.body.length > 0;
  const method = req.method.toUpperCase();

  try {
    const startedAt = Date.now();
    const upstream = await fetch(url.toString(), {
      method,
      headers,
      body: hasBody && method !== 'GET' && method !== 'HEAD' ? req.body : undefined,
      redirect: 'follow',
    });

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (!DROP_RESPONSE_HEADERS.has(key.toLowerCase())) res.setHeader(key, value);
    });
    res.setHeader('X-Proxy-Duration', `${Date.now() - startedAt}ms`);
    res.setHeader('X-Proxy-Target', url.toString());
    res.end(buffer);
  } catch (err) {
    res.status(502).json({
      error: '代理转发失败',
      message: err instanceof Error ? err.message : String(err),
      target: url.toString(),
    });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`\n  Postman Web 代理已启动: http://localhost:${PORT}/proxy`);
  console.log(`  健康检查: http://localhost:${PORT}/health\n`);
});
