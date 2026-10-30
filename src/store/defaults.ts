import type {
  AuthConfig,
  Collection,
  Environment,
  FormDataItem,
  KeyValue,
  RequestConfig,
  RequestTab,
  Settings,
} from '../types';
import { uid } from '../utils/id';

export const createKeyValue = (key = '', value = '', enabled = true): KeyValue => ({
  id: uid('kv'),
  key,
  value,
  enabled,
});

export const createEmptyRow = (): KeyValue => createKeyValue('', '', true);

export const createFormDataItem = (type: 'text' | 'file' = 'text'): FormDataItem => ({
  id: uid('fd'),
  key: '',
  value: '',
  type,
  enabled: true,
});

export const createAuthConfig = (): AuthConfig => ({
  type: 'none',
  token: '',
  username: '',
  password: '',
  key: '',
  value: '',
  addTo: 'header',
});

export const createRequest = (patch: Partial<RequestConfig> = {}): RequestConfig => ({
  id: uid('req'),
  name: '未命名请求',
  method: 'GET',
  url: '',
  params: [createEmptyRow()],
  headers: [createEmptyRow()],
  bodyType: 'none',
  rawBody: '',
  formData: [createFormDataItem('text')],
  auth: createAuthConfig(),
  ...patch,
});

export const createTab = (request?: RequestConfig): RequestTab => {
  const req = request ?? createRequest();
  return {
    id: uid('tab'),
    name: req.url ? req.url.replace(/^https?:\/\//, '').slice(0, 28) : '未命名请求',
    request: req,
    response: null,
    loading: false,
    error: null,
    savedRequestId: null,
    collectionId: null,
  };
};

export const createCollection = (name: string): Collection => ({
  id: uid('col'),
  name,
  requests: [],
  createdAt: Date.now(),
});

export const createEnvironment = (name: string): Environment => ({
  id: uid('env'),
  name,
  variables: [createKeyValue('baseUrl', 'https://jsonplaceholder.typicode.com'), createEmptyRow()],
});

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  proxyEnabled: false,
  proxyUrl: 'http://localhost:8787/proxy',
  timeoutMs: 30000,
  maxResponseBytes: 2 * 1024 * 1024,
  wordWrap: true,
  fontSize: 'medium',
  sendOnCtrlEnter: true,
};

export const SAMPLE_REQUEST_BODY = JSON.stringify(
  {
    title: 'Postman Web',
    body: '在浏览器里调试 HTTP 接口',
    userId: 1,
  },
  null,
  2,
);
