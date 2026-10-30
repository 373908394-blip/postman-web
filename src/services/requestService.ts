import type { RequestConfig, ResponseData, Settings } from '../types';
import { resolveVariables } from '../utils/variables';

export interface SendContext {
  /** 当前激活环境的变量字典 */
  variables: Record<string, string>;
  settings: Settings;
}

export class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestError';
  }
}

const TEXTUAL =
  /^(text\/|application\/(json|xml|javascript|x-www-form-urlencoded|graphql)|.*\+json|.*\+xml)/i;

const withScheme = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

/** 解析变量 + 拼接 query，得到最终请求地址。 */
export const buildFinalUrl = (request: RequestConfig, variables: Record<string, string>): string => {
  const base = withScheme(resolveVariables(request.url, variables));
  const params = request.params
    .filter((p) => p.enabled && p.key.trim())
    .map((p) => {
      const key = encodeURIComponent(resolveVariables(p.key.trim(), variables));
      const value = encodeURIComponent(resolveVariables(p.value, variables));
      return `${key}=${value}`;
    });

  if (request.auth.type === 'api-key' && request.auth.addTo === 'query' && request.auth.key.trim()) {
    params.push(
      `${encodeURIComponent(request.auth.key.trim())}=${encodeURIComponent(
        resolveVariables(request.auth.value, variables),
      )}`,
    );
  }

  if (!params.length) return base;
  const separator = base.includes('?')
    ? base.endsWith('?') || base.endsWith('&')
      ? ''
      : '&'
    : '?';
  return `${base}${separator}${params.join('&')}`;
};

const dataUrlToBlob = (dataUrl: string, mime?: string): Blob => {
  const [meta, base64] = dataUrl.split(',');
  const contentType = mime || /data:([^;]+)/.exec(meta)?.[1] || 'application/octet-stream';
  const binary = atob(base64 ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: contentType });
};

const collectHeaders = (
  request: RequestConfig,
  variables: Record<string, string>,
): Record<string, string> => {
  const headers: Record<string, string> = {};

  request.headers
    .filter((h) => h.enabled && h.key.trim())
    .forEach((h) => {
      headers[resolveVariables(h.key.trim(), variables)] = resolveVariables(h.value, variables);
    });

  const auth = request.auth;
  if (auth.type === 'bearer' && auth.token.trim()) {
    headers['Authorization'] = `Bearer ${resolveVariables(auth.token.trim(), variables)}`;
  } else if (auth.type === 'basic' && (auth.username || auth.password)) {
    const raw = `${resolveVariables(auth.username, variables)}:${resolveVariables(
      auth.password,
      variables,
    )}`;
    headers['Authorization'] = `Basic ${btoa(unescape(encodeURIComponent(raw)))}`;
  } else if (auth.type === 'api-key' && auth.addTo === 'header' && auth.key.trim()) {
    headers[resolveVariables(auth.key.trim(), variables)] = resolveVariables(auth.value, variables);
  }

  return headers;
};

const buildBody = (
  request: RequestConfig,
  variables: Record<string, string>,
  headers: Record<string, string>,
): BodyInit | undefined => {
  const hasHeader = (name: string) =>
    Object.keys(headers).some((h) => h.toLowerCase() === name.toLowerCase());

  switch (request.bodyType) {
    case 'none':
      return undefined;

    case 'raw-json': {
      if (!hasHeader('content-type')) headers['Content-Type'] = 'application/json';
      const raw = resolveVariables(request.rawBody, variables);
      return raw.trim() ? raw : undefined;
    }

    case 'raw-text': {
      if (!hasHeader('content-type')) headers['Content-Type'] = 'text/plain;charset=UTF-8';
      const raw = resolveVariables(request.rawBody, variables);
      return raw.trim() ? raw : undefined;
    }

    case 'raw-xml': {
      if (!hasHeader('content-type')) headers['Content-Type'] = 'application/xml';
      const raw = resolveVariables(request.rawBody, variables);
      return raw.trim() ? raw : undefined;
    }

    case 'x-www-form-urlencoded': {
      const body = new URLSearchParams();
      request.formData
        .filter((f) => f.enabled && f.key.trim() && f.type === 'text')
        .forEach((f) =>
          body.append(
            resolveVariables(f.key.trim(), variables),
            resolveVariables(f.value, variables),
          ),
        );
      if (!hasHeader('content-type')) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
      }
      return body.toString();
    }

    case 'form-data': {
      const form = new FormData();
      request.formData
        .filter((f) => f.enabled && f.key.trim())
        .forEach((f) => {
          const key = resolveVariables(f.key.trim(), variables);
          if (f.type === 'file' && f.fileData) {
            const blob = dataUrlToBlob(f.fileData, f.mime);
            form.append(key, blob, f.fileName || 'file');
          } else if (f.type === 'text') {
            form.append(key, resolveVariables(f.value, variables));
          }
        });
      // 让浏览器自动带上 multipart boundary，绝不能手动设置 Content-Type
      return form;
    }
    default:
      return undefined;
  }
};

const filterResponseHeaders = (raw: Headers, viaProxy: boolean): [string, string][] => {
  const result: [string, string][] = [];
  raw.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (viaProxy && lower.startsWith('x-proxy-')) return;
    if (
      lower === 'content-encoding' ||
      lower === 'transfer-encoding' ||
      lower === 'content-length'
    )
      return;
    result.push([key, value]);
  });
  return result;
};

/**
 * 发送一次 HTTP 请求。
 * - 直连：浏览器原生 fetch（受 CORS 限制）
 * - 代理：请求发到代理基址，真实目标写在 X-Target-URL，由代理转发
 */
export async function sendRequest(
  request: RequestConfig,
  ctx: SendContext,
): Promise<ResponseData> {
  const finalUrl = buildFinalUrl(request, ctx.variables);
  if (!finalUrl) throw new RequestError('请先填写请求地址');

  const headers = collectHeaders(request, ctx.variables);
  const body = buildBody(request, ctx.variables, headers);
  const viaProxy = ctx.settings.proxyEnabled && !!ctx.settings.proxyUrl.trim();

  const target = viaProxy ? ctx.settings.proxyUrl.trim() : finalUrl;
  const requestHeaders: Record<string, string> = { ...headers };
  if (viaProxy) {
    requestHeaders['X-Target-URL'] = finalUrl;
    delete requestHeaders['accept-encoding'];
    delete requestHeaders['Accept-Encoding'];
    delete requestHeaders['origin'];
    delete requestHeaders['Origin'];
  }

  const controller = new AbortController();
  const timeout = Math.max(1000, ctx.settings.timeoutMs || 30000);
  const timer = window.setTimeout(() => controller.abort(), timeout);
  const startedAt = performance.now();

  try {
    const response = await fetch(target, {
      method: request.method,
      headers: requestHeaders,
      body,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow',
      cache: 'no-store',
    });

    const buffer = await response.arrayBuffer();
    const elapsed = performance.now() - startedAt;
    const contentType = response.headers.get('content-type') ?? '';
    const maxBytes = ctx.settings.maxResponseBytes || 2 * 1024 * 1024;
    const truncated = buffer.byteLength > maxBytes;
    const slice = truncated ? buffer.slice(0, maxBytes) : buffer;
    const bodyText = new TextDecoder('utf-8', { fatal: false }).decode(slice);

    return {
      status: response.status,
      statusText: response.statusText || '',
      headers: filterResponseHeaders(response.headers, viaProxy),
      body: bodyText,
      contentType,
      size: buffer.byteLength,
      time: elapsed,
      url: finalUrl,
      method: request.method,
      truncated,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new RequestError(`请求超时（${timeout} ms）`);
    }
    if (err instanceof TypeError) {
      throw new RequestError(
        '网络请求失败，常见原因：① 目标服务未允许跨域（CORS）；② 地址不可达；③ 混合内容被拦截。' +
          (viaProxy ? '' : '可到「设置」开启本地代理后重试。'),
      );
    }
    throw new RequestError(err instanceof Error ? err.message : '未知错误');
  } finally {
    window.clearTimeout(timer);
  }
}
