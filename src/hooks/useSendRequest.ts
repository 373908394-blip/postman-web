import { useCallback } from 'react';
import { sendRequest } from '../services/requestService';
import { useTabsStore } from '../store/tabsStore';
import { useSettingsStore } from '../store/settingsStore';
import { useEnvironmentsStore } from '../store/environmentsStore';
import { useHistoryStore } from '../store/historyStore';
import { toVariableMap } from '../utils/variables';

/**
 * 发送指定 tab 的请求。故意做成普通函数（而非组件内逻辑），
 * 这样快捷键、按钮、历史重放都能复用同一套流程。
 */
export async function sendTabRequest(tabId: string): Promise<void> {
  const tabsState = useTabsStore.getState();
  const tab = tabsState.tabs.find((t) => t.id === tabId);
  if (!tab || tab.loading) return;

  if (!tab.request.url.trim()) {
    tabsState.setError(tabId, '请先填写请求地址');
    return;
  }

  const settings = useSettingsStore.getState().settings;
  const envState = useEnvironmentsStore.getState();
  const env = envState.environments.find((e) => e.id === envState.activeId) ?? null;
  const variables = toVariableMap(env);

  tabsState.setLoading(tabId, true);

  try {
    const response = await sendRequest(tab.request, { settings, variables });
    useTabsStore.getState().setResponse(tabId, response);
    useHistoryStore.getState().addEntry({
      method: tab.request.method,
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      time: response.time,
      size: response.size,
      request: tab.request,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '请求失败';
    useTabsStore.getState().setError(tabId, message);
    useHistoryStore.getState().addEntry({
      method: tab.request.method,
      url: tab.request.url,
      error: message,
      request: tab.request,
    });
  } finally {
    useTabsStore.getState().setLoading(tabId, false);
  }
}

export const useSendRequest = (): ((tabId: string) => Promise<void>) =>
  useCallback((tabId: string) => sendTabRequest(tabId), []);
