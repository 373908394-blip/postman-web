import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTabsStore } from './store/tabsStore';
import { useUiStore } from './store/uiStore';
import TopBar from './components/layout/TopBar';
import TabBar from './components/layout/TabBar';
import Sidebar from './components/layout/Sidebar';
import SettingsDialog from './components/layout/SettingsDialog';
import ToastHost from './components/common/ToastHost';
import RequestBuilder from './components/builder/RequestBuilder';
import ResponsePane from './components/response/ResponsePane';
import { useSendRequest } from './hooks/useSendRequest';

const MIN_RATIO = 0.2;
const MAX_RATIO = 0.85;

export default function App() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0] ?? null;
  const newTab = useTabsStore((s) => s.newTab);
  const closeTab = useTabsStore((s) => s.closeTab);
  const showToast = useUiStore((s) => s.showToast);
  const send = useSendRequest();

  const [ratio, setRatio] = useState(0.58);
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onMouseMove = useCallback((event: MouseEvent) => {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const next = (event.clientY - rect.top) / rect.height;
    setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, next)));
  }, []);

  const stopDrag = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, [onMouseMove, stopDrag]);

  // 全局快捷键
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        if (activeTab) void send(activeTab.id);
      } else if (event.key.toLowerCase() === 't') {
        event.preventDefault();
        newTab();
      } else if (event.key.toLowerCase() === 'w') {
        event.preventDefault();
        if (activeTab) closeTab(activeTab.id);
      } else if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        showToast('提示：Cmd/Ctrl + Enter 发送请求', 'info');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, send, newTab, closeTab, showToast]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar />
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <TabBar />
          <Box
            ref={containerRef}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                height: `${ratio * 100}%`,
                minHeight: 180,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {activeTab ? (
                <RequestBuilder tab={activeTab} />
              ) : (
                <Box sx={{ p: 4 }}>
                  <Typography color="text.secondary">
                    没有打开的请求，按 Cmd/Ctrl + T 新建
                  </Typography>
                </Box>
              )}
            </Box>

            <Box
              onMouseDown={() => {
                draggingRef.current = true;
                document.body.style.cursor = 'row-resize';
                document.body.style.userSelect = 'none';
              }}
              sx={{
                height: 6,
                cursor: 'row-resize',
                flexShrink: 0,
                bgcolor: 'transparent',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 2,
                  height: 1,
                  bgcolor: 'divider',
                },
                '&:hover::after': { bgcolor: 'primary.main', height: 2, top: 2 },
              }}
            />

            <Box sx={{ flex: 1, minHeight: 120, overflow: 'hidden', display: 'flex' }}>
              {activeTab ? (
                <ResponsePane tab={activeTab} />
              ) : (
                <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    发送请求后在这里查看响应
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <SettingsDialog />
      <ToastHost />
    </Box>
  );
}
