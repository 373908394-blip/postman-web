import { useRef, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  MenuOpen as MenuOpenIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  DarkModeOutlined,
  LightModeOutlined,
  SettingsBrightnessOutlined,
} from '@mui/icons-material';
import { useUiStore } from '../../store/uiStore';
import { useTabsStore } from '../../store/tabsStore';
import { useSettingsStore } from '../../store/settingsStore';
import EnvironmentSelect from './EnvironmentSelect';
import SaveToCollectionDialog from '../collection/SaveToCollectionDialog';
import { useResolvedMode } from '../../theme';

const REPO_URL = 'https://github.com/373908394-blip/postman-web';

export default function TopBar() {
  const activeTab = useTabsStore((s) => s.tabs.find((t) => t.id === s.activeTabId) ?? null);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
  const themeMode = useSettingsStore((s) => s.settings.theme);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resolved = useResolvedMode();

  const [saveOpen, setSaveOpen] = useState(false);
  const [themeAnchor, setThemeAnchor] = useState<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  const themeLabel = themeMode === 'system' ? '跟随系统' : themeMode === 'dark' ? '深色' : '浅色';

  return (
    <AppBar
      position="static"
      elevation={0}
      color="transparent"
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 48, gap: 1 }}>
        <Tooltip title="折叠/展开侧边栏">
          <IconButton size="small" onClick={toggleSidebar} aria-label="切换侧边栏">
            <MenuOpenIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #ff6c37, #ff9d5c)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            P
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
            Postman Web
          </Typography>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ my: 1 }} />

        <EnvironmentSelect />

        <Box sx={{ flex: 1 }} />

        <Button
          size="small"
          startIcon={<SaveIcon fontSize="small" />}
          onClick={() => setSaveOpen(true)}
          disabled={!activeTab}
          sx={{ textTransform: 'none' }}
        >
          保存
        </Button>

        <Tooltip title={`主题：${themeLabel}`}>
          <IconButton
            size="small"
            ref={anchorRef}
            onClick={(e) => setThemeAnchor(e.currentTarget)}
            aria-label="切换主题"
          >
            {themeMode === 'system' ? (
              <SettingsBrightnessOutlined fontSize="small" />
            ) : resolved === 'dark' ? (
              <DarkModeOutlined fontSize="small" />
            ) : (
              <LightModeOutlined fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Menu anchorEl={themeAnchor} open={!!themeAnchor} onClose={() => setThemeAnchor(null)}>
          <MenuItem
            selected={themeMode === 'light'}
            onClick={() => {
              updateSettings({ theme: 'light' });
              setThemeAnchor(null);
            }}
          >
            <LightModeOutlined fontSize="small" sx={{ mr: 1 }} /> 浅色
          </MenuItem>
          <MenuItem
            selected={themeMode === 'dark'}
            onClick={() => {
              updateSettings({ theme: 'dark' });
              setThemeAnchor(null);
            }}
          >
            <DarkModeOutlined fontSize="small" sx={{ mr: 1 }} /> 深色
          </MenuItem>
          <MenuItem
            selected={themeMode === 'system'}
            onClick={() => {
              updateSettings({ theme: 'system' });
              setThemeAnchor(null);
            }}
          >
            <SettingsBrightnessOutlined fontSize="small" sx={{ mr: 1 }} /> 跟随系统
          </MenuItem>
          <Divider />
          <MenuItem disabled sx={{ fontSize: 12, opacity: 0.7 }}>
            当前：{themeLabel}
          </MenuItem>
        </Menu>

        <Tooltip title="设置">
          <IconButton size="small" onClick={() => setSettingsOpen(true)} aria-label="设置">
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="项目源码">
          <IconButton
            size="small"
            component="a"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <GitHubIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Toolbar>

      {activeTab && (
        <SaveToCollectionDialog
          open={saveOpen}
          tab={activeTab}
          onClose={() => setSaveOpen(false)}
        />
      )}
    </AppBar>
  );
}
