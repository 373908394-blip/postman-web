import { Box, Checkbox, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { Add as AddIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import type { KeyValue } from '../../types';
import { createKeyValue } from '../../store/defaults';

interface KeyValueEditorProps {
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
  keyLabel?: string;
  valueLabel?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  /** 是否显示「描述」列，默认 true */
  showDescription?: boolean;
  /** 无数据时的提示文案 */
  emptyHint?: string;
}

const isBlank = (row: KeyValue): boolean =>
  !row.key.trim() && !row.value.trim() && !(row.description ?? '').trim();

/** 始终保证末尾有一行空行，避免用户「写到列表末尾没法继续加」。 */
const ensureTrailingBlank = (rows: KeyValue[]): KeyValue[] => {
  if (rows.length === 0) return [createKeyValue()];
  const last = rows[rows.length - 1];
  return isBlank(last) ? rows : [...rows, createKeyValue()];
};

/**
 * 通用键值对编辑表（Params / Headers 复用）。
 * 行内直接编辑，自动维护末尾空行；删除按钮 hover 才显示。
 */
export default function KeyValueEditor({
  rows,
  onChange,
  keyLabel = 'Key',
  valueLabel = 'Value',
  keyPlaceholder = '键',
  valuePlaceholder = '值',
  showDescription = true,
  emptyHint,
}: KeyValueEditorProps): JSX.Element {
  const updateRow = (id: string, patch: Partial<KeyValue>) =>
    onChange(ensureTrailingBlank(rows.map((row) => (row.id === id ? { ...row, ...patch } : row))));

  const removeRow = (id: string) => onChange(ensureTrailingBlank(rows.filter((row) => row.id !== id)));

  const addRow = () => onChange([...rows, createKeyValue()]);

  const allChecked = rows.length > 0 && rows.every((row) => row.enabled);
  const indeterminate = rows.some((row) => row.enabled) && !allChecked;
  const toggleAll = () => {
    const next = !allChecked;
    onChange(rows.map((row) => ({ ...row, enabled: next })));
  };

  const hasContent = rows.some((row) => !isBlank(row));

  const cellSx = { flex: 1, mx: 0.5 } as const;

  return (
    <Box>
      {/* 表头 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 0.5,
          py: 0.25,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Checkbox
          size="small"
          checked={allChecked}
          indeterminate={indeterminate}
          onChange={toggleAll}
        />
        <Typography variant="caption" sx={{ ...cellSx, fontWeight: 600, color: 'text.secondary' }}>
          {keyLabel}
        </Typography>
        <Typography variant="caption" sx={{ ...cellSx, fontWeight: 600, color: 'text.secondary' }}>
          {valueLabel}
        </Typography>
        {showDescription && (
          <Typography
            variant="caption"
            sx={{ ...cellSx, fontWeight: 600, color: 'text.secondary' }}
          >
            描述
          </Typography>
        )}
        <Box sx={{ width: 32 }} />
      </Box>

      {!hasContent && emptyHint && (
        <Typography
          variant="caption"
          sx={{ display: 'block', px: 1, py: 1, color: 'text.secondary' }}
        >
          {emptyHint}
        </Typography>
      )}

      {/* 数据行 */}
      {rows.map((row) => (
        <Box
          key={row.id}
          className="kv-row"
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 0.5,
            py: 0.25,
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: 34,
          }}
        >
          <Checkbox
            size="small"
            checked={row.enabled}
            onChange={(e) => updateRow(row.id, { enabled: e.target.checked })}
          />
          <TextField
            variant="standard"
            placeholder={keyPlaceholder}
            value={row.key}
            onChange={(e) => updateRow(row.id, { key: e.target.value })}
            InputProps={{ disableUnderline: true, sx: { fontSize: 13 } }}
            sx={cellSx}
          />
          <TextField
            variant="standard"
            placeholder={valuePlaceholder}
            value={row.value}
            onChange={(e) => updateRow(row.id, { value: e.target.value })}
            InputProps={{ disableUnderline: true, sx: { fontSize: 13 } }}
            sx={cellSx}
          />
          {showDescription && (
            <TextField
              variant="standard"
              placeholder="备注"
              value={row.description ?? ''}
              onChange={(e) => updateRow(row.id, { description: e.target.value })}
              InputProps={{ disableUnderline: true, sx: { fontSize: 12.5 } }}
              sx={cellSx}
            />
          )}
          <Box className="kv-row-actions" sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="删除该行">
              <IconButton size="small" onClick={() => removeRow(row.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ))}

      <Box sx={{ px: 0.5, py: 0.5 }}>
        <IconButton size="small" onClick={addRow} color="primary">
          <AddIcon fontSize="small" />
          <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
            添加一行
          </Typography>
        </IconButton>
      </Box>
    </Box>
  );
}
