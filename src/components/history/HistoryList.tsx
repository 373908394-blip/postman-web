import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import HistoryIcon from '@mui/icons-material/History';
import type { HttpMethod } from '../../types';
import { useHistoryStore } from '../../store/historyStore';
import { useTabsStore } from '../../store/tabsStore';
import { formatRelative, statusColor } from '../../utils/format';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#2e7d32',
  POST: '#b26a00',
  PUT: '#1565c0',
  PATCH: '#6a1b9a',
  DELETE: '#c62828',
  HEAD: '#546e7a',
  OPTIONS: '#546e7a',
};

function MethodBadge({ method }: { method: HttpMethod }): JSX.Element {
  return (
    <span
      style={{
        width: 46,
        flexShrink: 0,
        textAlign: 'center',
        fontSize: 10,
        fontWeight: 700,
        color: '#fff',
        background: METHOD_COLORS[method],
        borderRadius: 4,
        padding: '1px 0',
      }}
    >
      {method}
    </span>
  );
}

/**
 * 历史记录列表：读取 useHistoryStore.entries，点击在新标签打开，支持单条删除与清空。
 */
export default function HistoryList(): JSX.Element {
  const entries = useHistoryStore((s) => s.entries);
  const removeEntry = useHistoryStore((s) => s.removeEntry);
  const clearAll = useHistoryStore((s) => s.clearAll);
  const newTab = useTabsStore((s) => s.newTab);

  const handleClear = (): void => {
    if (entries.length === 0) return;
    if (window.confirm('确定清空全部历史记录？')) clearAll();
  };

  return (
    <Box className="flex h-full flex-col">
      {/* 头部 */}
      <Box
        className="flex items-center gap-1 px-2 py-1"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="subtitle2" className="flex-1">
          历史记录（{entries.length}）
        </Typography>
        <Tooltip title="清空历史">
          <span>
            <IconButton size="small" onClick={handleClear} disabled={entries.length === 0}>
              <ClearAllIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* 列表 */}
      <Box className="flex-1 overflow-auto" sx={{ minHeight: 0 }}>
        {entries.length === 0 && (
          <Box
            className="flex flex-col items-center justify-center gap-2 p-6"
            sx={{ color: 'text.secondary' }}
          >
            <HistoryIcon sx={{ fontSize: 32, opacity: 0.5 }} />
            <Typography variant="caption">还没有请求历史</Typography>
          </Box>
        )}

        {entries.map((entry) => (
          <Box
            key={entry.id}
            className="kv-row flex items-center gap-1.5 px-2 py-1"
            sx={{
              cursor: 'pointer',
              borderBottom: 1,
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => newTab(entry.request)}
            title={entry.url}
          >
            <MethodBadge method={entry.method} />
            <Box className="flex-1" sx={{ minWidth: 0 }}>
              <Typography variant="body2" className="truncate">
                {entry.url}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatRelative(entry.createdAt)}
              </Typography>
            </Box>
            {entry.error ? (
              <Chip size="small" color="error" label="失败" sx={{ height: 18, fontSize: 10 }} />
            ) : entry.status != null ? (
              <Chip
                size="small"
                variant="outlined"
                color={statusColor(entry.status)}
                label={entry.status}
                sx={{ height: 18, fontSize: 10 }}
              />
            ) : null}
            <Box className="kv-row-actions flex items-center" onClick={(e) => e.stopPropagation()}>
              <Tooltip title="删除该记录">
                <IconButton size="small" onClick={() => removeEntry(entry.id)}>
                  <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
