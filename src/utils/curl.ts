import type { RequestConfig } from '../types';

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** 纯 JS 的 UTF-8 → base64，避免依赖 btoa 的 latin1 限制与 Node 的 Buffer。 */
const base64Utf8 = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 0x03) << 4) | ((b1 ?? 0) >> 4)];
    out += i + 1 < bytes.length ? B64_CHARS[((b1 & 0x0f) << 2) | ((b2 ?? 0) >> 6)] : '=';
    out += i + 2 < bytes.length ? B64_CHARS[b2 & 0x3f] : '=';
  }
  return out;
};

const shellQuote = (value: string): string => {
  if (!value) return "''";
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
};

const buildUrlWithParams = (request: RequestConfig): string => {
  let base = request.url.trim();
  if (base && !/^https?:\/\//i.test(base)) base = `https://${base}`;
  const query = request.params
    .filter((p) => p.enabled && p.key.trim())
    .map((p) => `${encodeURIComponent(p.key.trim())}=${encodeURIComponent(p.value)}`)
    .join('&');
  if (!query) return base;
  return base.includes('?') ? `${base}&${query}` : `${base}?${query}`;
};

/** 生成可直接粘贴到终端的 cURL 命令（含 headers / body / auth）。 */
export const toCurl = (request: RequestConfig): string => {
  const parts: string[] = ['curl', '-X', request.method, shellQuote(buildUrlWithParams(request))];

  const headers = request.headers.filter((h) => h.enabled && h.key.trim());

  if (request.auth.type === 'bearer' && request.auth.token) {
    headers.push({
      id: 'auth',
      key: 'Authorization',
      value: `Bearer ${request.auth.token}`,
      enabled: true,
    });
  } else if (request.auth.type === 'basic' && (request.auth.username || request.auth.password)) {
    const raw = `${request.auth.username}:${request.auth.password}`;
    const encoded = base64Utf8(raw);
    headers.push({ id: 'auth', key: 'Authorization', value: `Basic ${encoded}`, enabled: true });
  } else if (request.auth.type === 'api-key' && request.auth.key && request.auth.addTo === 'header') {
    headers.push({
      id: 'auth',
      key: request.auth.key,
      value: request.auth.value,
      enabled: true,
    });
  }

  headers.forEach((h) => {
    parts.push('-H', shellQuote(`${h.key.trim()}: ${h.value}`));
  });

  if (request.bodyType === 'raw-json' && request.rawBody.trim()) {
    parts.push('-H', shellQuote('Content-Type: application/json'));
    parts.push('--data-raw', shellQuote(request.rawBody));
  } else if (request.bodyType === 'raw-text' && request.rawBody.trim()) {
    parts.push('-H', shellQuote('Content-Type: text/plain'));
    parts.push('--data-raw', shellQuote(request.rawBody));
  } else if (request.bodyType === 'raw-xml' && request.rawBody.trim()) {
    parts.push('-H', shellQuote('Content-Type: application/xml'));
    parts.push('--data-raw', shellQuote(request.rawBody));
  } else if (request.bodyType === 'x-www-form-urlencoded') {
    const body = request.formData
      .filter((f) => f.enabled && f.key.trim() && f.type === 'text')
      .map((f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`)
      .join('&');
    if (body) {
      parts.push('-H', shellQuote('Content-Type: application/x-www-form-urlencoded'));
      parts.push('--data-raw', shellQuote(body));
    }
  } else if (request.bodyType === 'form-data') {
    request.formData
      .filter((f) => f.enabled && f.key.trim())
      .forEach((f) => {
        if (f.type === 'file') parts.push('-F', shellQuote(`${f.key}=@${f.fileName ?? 'file'}`));
        else parts.push('-F', shellQuote(`${f.key}=${f.value}`));
      });
  }

  return parts.join(' \\\n  ');
};
