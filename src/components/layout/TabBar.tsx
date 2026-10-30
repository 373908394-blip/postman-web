import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Circle as DotIcon } from '@mui/icons-material';
import { useTabsStore } from '../../store/tabsStore';

/** 多标签页栏：每个 tab 独立维护自己的请求/响应。 */
export default function TabBar() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const setActiveTab = useTabsStore((s) => s.setActiveTab);
  const closeTab = useTabsStore((s) => s.closeTab);
  const newTab = useTabsStore((s) => s.newTab);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: 1,
        borderColor: 'divider',
        overflowX: 'auto',
        overflowY: 'hidden',
        minHeight: 38,
        '&::-webkit-scrollbar': { height: 4 },
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <Box
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              pl: 1.5,
              pr: 0.5,
              maxWidth: 220,
              minWidth: 120,
              cursor: 'pointer',
              borderRight: 1,
              borderColor: 'divider',
              borderTop: 2,
              borderTopColor: active ? 'primary.main' : 'transparent',
              bgcolor: active ? 'background.paper' : 'transparent',
              opacity: active ? 1 : 0.72,
              '&:hover': { bgcolor: 'action.hover', opacity: 1 },
            }}
          >
            {tab.loading && <DotIcon sx={{ fontSize: 9, color: 'primary.main', flexShrink: 0 }} />}
            <Typography
              variant="caption"
              noWrap
              sx={{ flex: 1, fontSize: 12.5, fontWeight: active ? 600 : 400 }}
            >
              {tab.name || '未命名请求'}
            </Typography>
            <Tooltip title="关闭标签">
              <IconButton
                size="small"
                sx={{ p: 0.25 }}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <CloseIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      })}
      <Tooltip title="新建请求标签">
        <IconButton size="small" sx={{ mx: 0.5, alignSelf: 'center' }} onClick={() => newTab()}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
