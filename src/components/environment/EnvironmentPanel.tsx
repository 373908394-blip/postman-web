import { useEffect, useState } from 'react';
import {
  Box,
  Checkbox,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { KeyValue } from '../../types';
import { useEnvironmentsStore } from '../../store/environmentsStore';
import { createKeyValue } from '../../store/defaults';

/** 保证末尾始终有一个空行（用于新增变量），实现「空行自动追加」。 */
function ensureTrailing(rows: KeyValue[]): KeyValue[] {
  if (rows.length === 0) return [createKeyValue('', '')];
  const last = rows[rows.length - 1];
  if (last.key === '' && last.value === '') return rows;
  return [...rows, createKeyValue('', '')];
}

/**
 * 环境面板：切换激活环境、增删改环境，编辑当前环境的变量键值。
 * 变量在请求中以 {{变量名}} 引用。
 */
export default function EnvironmentPanel(): JSX.Element {
  const environments = useEnvironmentsStore((s) => s.environments);
  const activeId = useEnvironmentsStore((s) => s.activeId);
  const addEnvironment = useEnvironmentsStore((s) => s.addEnvironment);
  const renameEnvironment = useEnvironmentsStore((s) => s.renameEnvironment);
  const removeEnvironment = useEnvironmentsStore((s) => s.removeEnvironment);
  const setActiveId = useEnvironmentsStore((s) => s.setActiveId);
  const setVariables = useEnvironmentsStore((s) => s.setVariables);

  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');

  const active = environments.find((e) => e.id === activeId) ?? environments[0] ?? null;

  // 切换环境时确保末尾有空行
  useEffect(() => {
    if (active) setVariables(active.id, ensureTrailing(active.variables));
    // 仅在激活环境切换时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const updateRow = (rowId: string, patch: Partial<KeyValue>): void => {
    if (!active) return;
    const next = active.variables.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
    setVariables(active.id, ensureTrailing(next));
  };

  const addRow = (): void => {
    if (!active) return;
    setVariables(active.id, [...active.variables, createKeyValue('', '')]);
  };

  const removeRow = (rowId: string): void => {
    if (!active) return;
    setVariables(
      active.id,
      ensureTrailing(active.variables.filter((row) => row.id !== rowId)),
    );
  };

  const startRename = (): void => {
    if (!active) return;
    setDraftName(active.name);
    setRenaming(true);
  };

  const commitRename = (): void => {
    if (active && draftName.trim()) renameEnvironment(active.id, draftName.trim());
    setRenaming(false);
  };

  const handleRemove = (): void => {
    if (!active) return;
    if (window.confirm(`删除环境「${active.name}」？`)) removeEnvironment(active.id);
  };

  return (
    <Box className="flex h-full flex-col gap-2 p-2" sx={{ overflow: 'auto' }}>
      {/* 头部 */}
      <Box className="flex items-center gap-1">
        <Typography variant="subtitle2" className="flex-1">
          环境
        </Typography>
        <Tooltip title="新建环境">
          <IconButton
            size="small"
            onClick={() => {
              const id = addEnvironment('新建环境');
              setActiveId(id);
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 环境选择 / 重命名 */}
      {environments.length === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          暂无环境，点击右上 + 新建。
        </Typography>
      ) : (
        <Box className="flex items-center gap-1">
          {renaming ? (
            <TextField
              size="small"
              fullWidth
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenaming(false);
              }}
            />
          ) : (
            <Select
              size="small"
              fullWidth
              displayEmpty
              value={active?.id ?? ''}
              onChange={(e) => setActiveId(e.target.value || null)}
            >
              {environments.map((env) => (
                <MenuItem key={env.id} value={env.id}>
                  {env.name}
                </MenuItem>
              ))}
            </Select>
          )}
          {!renaming && (
            <>
              <Tooltip title="重命名环境">
                <IconButton size="small" onClick={startRename}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="删除环境">
                <IconButton size="small" onClick={handleRemove}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
        在请求里用 {'{{变量名}}'} 引用，例如 {'{{baseUrl}}/posts'}
      </Typography>

      {/* 变量编辑 */}
      {active && (
        <Box className="flex flex-col gap-1">
          {active.variables.map((row) => (
            <Box key={row.id} className="kv-row flex items-center gap-1">
              <Checkbox
                size="small"
                checked={row.enabled}
                onChange={(e) => updateRow(row.id, { enabled: e.target.checked })}
              />
              <TextField
                size="small"
                className="flex-1"
                placeholder="变量名"
                value={row.key}
                onChange={(e) => updateRow(row.id, { key: e.target.value })}
              />
              <TextField
                size="small"
                className="flex-1"
                placeholder="值"
                value={row.value}
                onChange={(e) => updateRow(row.id, { value: e.target.value })}
              />
              <Box className="kv-row-actions">
                <IconButton size="small" onClick={() => removeRow(row.id)}>
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>
          ))}
          <Box>
            <Tooltip title="添加变量">
              <IconButton size="small" color="primary" onClick={addRow}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Box>
  );
}
