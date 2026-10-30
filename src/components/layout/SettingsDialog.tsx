import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useCollectionsStore } from '../../store/collectionsStore';
import { useEnvironmentsStore } from '../../store/environmentsStore';
import { useHistoryStore } from '../../store/historyStore';
import type { Collection, Environment, HistoryEntry, ThemeMode } from '../../types';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
      {title}
    </Typography>
    <Box sx={{ mt: 0.5 }}>{children}</Box>
  </Box>
);

export default function SettingsDialog() {
  const open = useUiStore((s) => s.settingsOpen);
  const setOpen = useUiStore((s) => s.setSettingsOpen);
  const showToast = useUiStore((s) => s.showToast);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const data = {
      app: 'postman-web',
      version: 1,
      exportedAt: new Date().toISOString(),
      collections: useCollectionsStore.getState().collections,
      environments: useEnvironmentsStore.getState().environments,
      history: useHistoryStore.getState().entries,
      settings: useSettingsStore.getState().settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postman-web-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('已导出备份文件');
  };

  const handleImport = async (file: File) => {
    setImportError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as {
        collections?: Collection[];
        environments?: Environment[];
        history?: HistoryEntry[];
      };
      if (!Array.isArray(data.collections) && !Array.isArray(data.environments)) {
        throw new Error('文件格式不正确：缺少 collections / environments 字段');
      }
      if (data.collections) useCollectionsStore.setState({ collections: data.collections });
      if (data.environments) useEnvironmentsStore.setState({ environments: data.environments });
      if (data.history) useHistoryStore.setState({ entries: data.history });
      showToast('导入成功');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '导入失败');
    }
  };

  const handleClear = () => {
    if (!window.confirm('确定清空所有本地数据（集合、历史、环境变量、设置）吗？此操作不可撤销。')) return;
    Object.keys(localStorage)
      .filter((key) => key.startsWith('pmweb:'))
      .forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  useEffect(() => {
    if (!open) setImportError(null);
  }, [open]);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>设置</DialogTitle>
      <DialogContent dividers>
        <Section title="外观">
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={settings.theme}
              onChange={(_, value: ThemeMode | null) => value && updateSettings({ theme: value })}
            >
              <ToggleButton value="light" sx={{ px: 2, fontSize: 12 }}>
                浅色
              </ToggleButton>
              <ToggleButton value="dark" sx={{ px: 2, fontSize: 12 }}>
                深色
              </ToggleButton>
              <ToggleButton value="system" sx={{ px: 2, fontSize: 12 }}>
                跟随系统
              </ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={settings.fontSize}
              onChange={(_, value) => value && updateSettings({ fontSize: value })}
            >
              <ToggleButton value="small" sx={{ px: 1.5, fontSize: 12 }}>
                小
              </ToggleButton>
              <ToggleButton value="medium" sx={{ px: 1.5, fontSize: 12 }}>
                中
              </ToggleButton>
              <ToggleButton value="large" sx={{ px: 1.5, fontSize: 12 }}>
                大
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={settings.wordWrap}
                onChange={(e) => updateSettings({ wordWrap: e.target.checked })}
              />
            }
            label={<Typography variant="body2">响应体自动换行</Typography>}
          />
        </Section>

        <Divider sx={{ mb: 2 }} />

        <Section title="请求">
          <Stack direction="row" spacing={2}>
            <TextField
              label="超时时间 (ms)"
              type="number"
              value={settings.timeoutMs}
              onChange={(e) =>
                updateSettings({ timeoutMs: Math.max(1000, Number(e.target.value) || 30000) })
              }
              sx={{ width: 170 }}
            />
            <TextField
              label="响应体上限 (KB)"
              type="number"
              value={Math.round(settings.maxResponseBytes / 1024)}
              onChange={(e) =>
                updateSettings({
                  maxResponseBytes: Math.max(64, Number(e.target.value) || 2048) * 1024,
                })
              }
              sx={{ width: 170 }}
            />
          </Stack>
        </Section>

        <Divider sx={{ mb: 2 }} />

        <Section title="代理（解决 CORS）">
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={settings.proxyEnabled}
                onChange={(e) => updateSettings({ proxyEnabled: e.target.checked })}
              />
            }
            label={<Typography variant="body2">通过代理发送请求</Typography>}
          />
          <TextField
            fullWidth
            label="代理地址"
            placeholder="http://localhost:8787/proxy"
            value={settings.proxyUrl}
            onChange={(e) => updateSettings({ proxyUrl: e.target.value })}
            sx={{ mt: 1 }}
          />
          <Alert severity="info" sx={{ mt: 1, py: 0.25, fontSize: 12 }}>
            浏览器受同源策略限制，直连失败的接口可开启代理。本地启动：
            <code style={{ marginLeft: 4 }}>npm run proxy</code>
            （默认 8787 端口）。GitHub Pages 版本需要你自己部署代理服务。
          </Alert>
        </Section>

        <Divider sx={{ mb: 2 }} />

        <Section title="数据（存于浏览器 localStorage）">
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" variant="outlined" onClick={handleExport}>
              导出备份
            </Button>
            <Button size="small" variant="outlined" onClick={() => fileRef.current?.click()}>
              导入备份
            </Button>
            <Button size="small" variant="outlined" color="error" onClick={handleClear}>
              清空全部数据
            </Button>
            <Button size="small" onClick={resetSettings}>
              恢复默认设置
            </Button>
          </Stack>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = '';
            }}
          />
          {importError && (
            <Alert severity="error" sx={{ mt: 1, fontSize: 12 }}>
              {importError}
            </Alert>
          )}
        </Section>
      </DialogContent>
      <DialogActions>
        <MenuItem sx={{ fontSize: 12, color: 'text.secondary', mr: 'auto' }} disabled>
          v1.0.0 · 数据仅保存在浏览器
        </MenuItem>
        <Button onClick={() => setOpen(false)}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
}
