import { useState } from 'react';
import { Box, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { HttpMethod } from '../../types';
import { useCollectionsStore } from '../../store/collectionsStore';
import { useTabsStore } from '../../store/tabsStore';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#2e7d32',
  POST: '#b26a00',
  PUT: '#1565c0',
  PATCH: '#6a1b9a',
  DELETE: '#c62828',
  HEAD: '#546e7a',
  OPTIONS: '#546e7a',
};

/** 方法小标签（固定宽度，便于对齐） */
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
 * 集合树：读取 useCollectionsStore，支持新建/重命名/删除集合与请求、
 * 点击请求在新标签打开（关联保存来源）。删除等破坏性操作使用 window.confirm 二次确认。
 */
export default function CollectionTree(): JSX.Element {
  const collections = useCollectionsStore((s) => s.collections);
  const addCollection = useCollectionsStore((s) => s.addCollection);
  const renameCollection = useCollectionsStore((s) => s.renameCollection);
  const removeCollection = useCollectionsStore((s) => s.removeCollection);
  const removeRequest = useCollectionsStore((s) => s.removeRequest);
  const duplicateRequest = useCollectionsStore((s) => s.duplicateRequest);
  const newTab = useTabsStore((s) => s.newTab);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggle = (id: string): void => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const commitNew = (): void => {
    const name = newName.trim();
    if (name) addCollection(name);
    setNewName('');
    setCreating(false);
  };

  const startRename = (id: string, name: string): void => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const commitRename = (): void => {
    if (renamingId && renameValue.trim()) renameCollection(renamingId, renameValue.trim());
    setRenamingId(null);
    setRenameValue('');
  };

  const openRequest = (collectionId: string, savedId: string): void => {
    const col = collections.find((c) => c.id === collectionId);
    const saved = col?.requests.find((r) => r.id === savedId);
    if (!col || !saved) return;
    newTab(saved.request, { savedRequestId: saved.id, collectionId: col.id, name: saved.name });
  };

  return (
    <Box className="flex h-full flex-col">
      {/* 头部 */}
      <Box
        className="flex items-center gap-1 px-2 py-1"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="subtitle2" className="flex-1">
          集合
        </Typography>
        <Tooltip title="新建集合">
          <IconButton
            size="small"
            onClick={() => {
              setCreating(true);
              setNewName('');
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 树 */}
      <Box className="flex-1 overflow-auto p-1" sx={{ minHeight: 0 }}>
        {creating && (
          <Box className="mb-1 px-1">
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="集合名称，回车创建"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitNew();
                if (e.key === 'Escape') setCreating(false);
              }}
              onBlur={commitNew}
            />
          </Box>
        )}

        {collections.length === 0 && !creating && (
          <Box className="p-3 text-center">
            <Typography variant="caption" color="text.secondary">
              还没有集合，点击右上 + 新建
            </Typography>
          </Box>
        )}

        {collections.map((col) => {
          const isCollapsed = !!collapsed[col.id];
          return (
            <Box key={col.id} className="mb-0.5">
              {/* 集合标题行 */}
              <Box
                className="kv-row flex items-center gap-1 rounded px-1 py-0.5"
                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
              >
                <IconButton size="small" onClick={() => toggle(col.id)} sx={{ p: 0.25 }}>
                  {isCollapsed ? (
                    <ChevronRightIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </IconButton>
                {isCollapsed ? (
                  <FolderOutlinedIcon fontSize="small" />
                ) : (
                  <FolderOpenOutlinedIcon fontSize="small" />
                )}
                {renamingId === col.id ? (
                  <TextField
                    size="small"
                    fullWidth
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    sx={{ ml: 0.5 }}
                  />
                ) : (
                  <Typography variant="body2" className="flex-1 truncate" title={col.name}>
                    {col.name}
                  </Typography>
                )}
                {renamingId !== col.id && (
                  <Box className="kv-row-actions flex items-center">
                    <Tooltip title="重命名">
                      <IconButton size="small" onClick={() => startRename(col.id, col.name)}>
                        <EditOutlinedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除集合">
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (window.confirm(`删除集合「${col.name}」？`)) removeCollection(col.id);
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              {/* 请求列表 */}
              {!isCollapsed && (
                <Box sx={{ pl: 3 }}>
                  {col.requests.length === 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', px: 1, py: 0.5 }}
                    >
                      拖入或保存请求到这里
                    </Typography>
                  )}
                  {col.requests.map((saved) => (
                    <Box
                      key={saved.id}
                      className="kv-row flex items-center gap-1 rounded px-1 py-0.5"
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      onClick={() => openRequest(col.id, saved.id)}
                    >
                      <MethodBadge method={saved.request.method} />
                      <Typography variant="body2" className="flex-1 truncate" title={saved.name}>
                        {saved.name}
                      </Typography>
                      <Box
                        className="kv-row-actions flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Tooltip title="复制">
                          <IconButton size="small" onClick={() => duplicateRequest(col.id, saved.id)}>
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除">
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (window.confirm(`删除请求「${saved.name}」？`)) {
                                removeRequest(col.id, saved.id);
                              }
                            }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
