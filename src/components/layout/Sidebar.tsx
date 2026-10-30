import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import HistoryIcon from '@mui/icons-material/History';
import PublicIcon from '@mui/icons-material/Public';
import type { SidebarTab } from '../../types';
import { useUiStore } from '../../store/uiStore';
import CollectionTree from '../collection/CollectionTree';
import HistoryList from '../history/HistoryList';
import EnvironmentPanel from '../environment/EnvironmentPanel';

/**
 * 左侧栏：宽 280px，可折叠（useUiStore.sidebarOpen）。
 * 顶部三个图标切换「集合 / 历史 / 环境」，下方按当前 tab 渲染对应面板。
 */
export default function Sidebar(): JSX.Element {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const sidebarTab = useUiStore((s) => s.sidebarTab);
  const setSidebarTab = useUiStore((s) => s.setSidebarTab);

  if (!sidebarOpen) return <></>;

  return (
    <Box
      className="flex h-full flex-col"
      sx={{ width: 280, minWidth: 280, borderRight: 1, borderColor: 'divider' }}
    >
      {/* 顶部切换 */}
      <Box
        className="flex items-center justify-center px-2 py-1"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={sidebarTab}
          onChange={(_, value: SidebarTab | null) => {
            if (value) setSidebarTab(value);
          }}
          sx={{ width: '100%' }}
        >
          <Tooltip title="集合">
            <ToggleButton
              value="collections"
              sx={{ flex: 1, py: 0.25, gap: 0.5, textTransform: 'none' }}
            >
              <FolderOutlinedIcon sx={{ fontSize: 16 }} />
              集合
            </ToggleButton>
          </Tooltip>
          <Tooltip title="历史">
            <ToggleButton value="history" sx={{ flex: 1, py: 0.25, gap: 0.5, textTransform: 'none' }}>
              <HistoryIcon sx={{ fontSize: 16 }} />
              历史
            </ToggleButton>
          </Tooltip>
          <Tooltip title="环境">
            <ToggleButton
              value="environments"
              sx={{ flex: 1, py: 0.25, gap: 0.5, textTransform: 'none' }}
            >
              <PublicIcon sx={{ fontSize: 16 }} />
              环境
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      </Box>

      {/* 面板内容 */}
      <Box className="flex-1" sx={{ minHeight: 0, overflow: 'hidden' }}>
        {sidebarTab === 'collections' && <CollectionTree />}
        {sidebarTab === 'history' && <HistoryList />}
        {sidebarTab === 'environments' && <EnvironmentPanel />}
      </Box>
    </Box>
  );
}
