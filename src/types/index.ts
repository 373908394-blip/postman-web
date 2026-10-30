/** 全局领域模型定义 —— 所有 store / 组件共用这一份类型。 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/** 键值对行（Params / Headers / 环境变量 / urlencoded 共用） */
export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export type BodyType =
  | 'none'
  | 'form-data'
  | 'x-www-form-urlencoded'
  | 'raw-json'
  | 'raw-text'
  | 'raw-xml';

export const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'none' },
  { value: 'form-data', label: 'form-data' },
  { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
  { value: 'raw-json', label: 'raw · JSON' },
  { value: 'raw-text', label: 'raw · Text' },
  { value: 'raw-xml', label: 'raw · XML' },
];

/**
 * form-data 行。文件以 base64 dataURL 形式持久化，这样刷新页面后仍能重发，
 * 并能同时支持「直连」与「代理」两种发送模式。
 */
export interface FormDataItem {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
  fileName?: string;
  fileData?: string; // data:<mime>;base64,xxxx
  mime?: string;
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'api-key';

export interface AuthConfig {
  type: AuthType;
  token: string;
  username: string;
  password: string;
  key: string;
  value: string;
  addTo: 'header' | 'query';
}

export interface RequestConfig {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  bodyType: BodyType;
  rawBody: string;
  formData: FormDataItem[];
  auth: AuthConfig;
}

export interface ResponseData {
  status: number;
  statusText: string;
  /** 保持服务端返回顺序，便于展示 */
  headers: [string, string][];
  body: string;
  contentType: string;
  /** 字节数 */
  size: number;
  /** 毫秒 */
  time: number;
  /** 最终请求地址（已解析变量、已拼 query） */
  url: string;
  method: HttpMethod;
  /** 响应体是否被截断 */
  truncated: boolean;
}

export interface SavedRequest {
  id: string;
  name: string;
  request: RequestConfig;
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: SavedRequest[];
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  status?: number;
  statusText?: string;
  time?: number;
  size?: number;
  error?: string;
  createdAt: number;
  request: RequestConfig;
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValue[];
}

export interface RequestTab {
  id: string;
  /** 显示名，默认「未命名请求」 */
  name: string;
  request: RequestConfig;
  response: ResponseData | null;
  loading: boolean;
  error: string | null;
  /** 关联的已保存请求 id */
  savedRequestId: string | null;
  collectionId: string | null;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  theme: ThemeMode;
  /** 是否启用代理发送 */
  proxyEnabled: boolean;
  /** 代理基址，例如 http://localhost:8787/proxy */
  proxyUrl: string;
  timeoutMs: number;
  /** 响应体最大展示体积（字节） */
  maxResponseBytes: number;
  wordWrap: boolean;
  fontSize: 'small' | 'medium' | 'large';
  sendOnCtrlEnter: boolean;
}

export type SidebarTab = 'collections' | 'history' | 'environments';
