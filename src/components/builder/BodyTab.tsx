import {
  Box,
  Button,
  Checkbox,
  IconButton,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  DataObject as FormatIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import type { BodyType, FormDataItem, RequestTab } from '../../types';
import { BODY_TYPES } from '../../types';
import { useTabsStore } from '../../store/tabsStore';
import { createFormDataItem } from '../../store/defaults';
import { useUiStore } from '../../store/uiStore';
import { prettyJson } from '../../utils/jsonHighlight';
import { formatBytes } from '../../utils/format';

interface BodyTabProps {
  tab: RequestTab;
}

const RAW_TYPES: BodyType[] = ['raw-json', 'raw-text', 'raw-xml'];
const isRawType = (type: BodyType): boolean => RAW_TYPES.includes(type);

const isFormBlank = (item: FormDataItem): boolean =>
  !item.key.trim() && !item.value.trim() && !item.fileName;

const ensureBlank = (items: FormDataItem[], type: 'text' | 'file'): FormDataItem[] => {
  if (items.length === 0) return [createFormDataItem(type)];
  return isFormBlank(items[items.length - 1]) ? items : [...items, createFormDataItem(type)];
};

interface FormDataEditorProps {
  items: FormDataItem[];
  onChange: (items: FormDataItem[]) => void;
  allowFile: boolean;
}

/** form-data / x-www-form-urlencoded 行编辑器（文件转 base64 持久化）。 */
function FormDataEditor({ items, onChange, allowFile }: FormDataEditorProps): JSX.Element {
  const update = (id: string, patch: Partial<FormDataItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const remove = (id: string) =>
    onChange(ensureBlank(items.filter((item) => item.id !== id), 'text'));

  const add = () => onChange([...items, createFormDataItem('text')]);

  const handleFile = (item: FormDataItem, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      update(item.id, {
        fileName: file.name,
        fileData: dataUrl,
        mime: file.type,
        value: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const cellSx = { flex: 1, mx: 0.5 } as const;

  return (
    <Box>
      {items.map((item) => {
        const approxBytes = item.fileData ? Math.floor(item.fileData.length * 0.75) : 0;
        return (
          <Box
            key={item.id}
            className="kv-row"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 0.5,
              py: 0.25,
              borderBottom: 1,
              borderColor: 'divider',
              minHeight: 36,
            }}
          >
            <Checkbox
              size="small"
              checked={item.enabled}
              onChange={(e) => update(item.id, { enabled: e.target.checked })}
            />

            {allowFile && (
              <Select
                value={item.type}
                onChange={(e) =>
                  update(item.id, {
                    type: e.target.value as 'text' | 'file',
                    value: '',
                    fileName: undefined,
                    fileData: undefined,
                    mime: undefined,
                  })
                }
                sx={{ width: 86 }}
              >
                <MenuItem value="text">文本</MenuItem>
                <MenuItem value="file">文件</MenuItem>
              </Select>
            )}

            <TextField
              variant="standard"
              placeholder="键"
              value={item.key}
              onChange={(e) => update(item.id, { key: e.target.value })}
              InputProps={{ disableUnderline: true, sx: { fontSize: 13 } }}
              sx={cellSx}
            />

            {allowFile && item.type === 'file' ? (
              <Box
                sx={{ flex: 1, mx: 0.5, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}
              >
                <Button component="label" size="small" variant="outlined">
                  选择文件
                  <input
                    type="file"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(item, file);
                    }}
                  />
                </Button>
                {item.fileName ? (
                  <Typography
                    variant="caption"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'text.secondary',
                    }}
                  >
                    {item.fileName}
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    未选择文件
                  </Typography>
                )}
                {approxBytes > 2 * 1024 * 1024 && (
                  <Typography variant="caption" noWrap sx={{ color: 'warning.main' }}>
                    约 {formatBytes(approxBytes)}，过大可能超出本地存储容量
                  </Typography>
                )}
              </Box>
            ) : (
              <TextField
                variant="standard"
                placeholder="值"
                value={item.value}
                onChange={(e) => update(item.id, { value: e.target.value })}
                InputProps={{ disableUnderline: true, sx: { fontSize: 13 } }}
                sx={cellSx}
              />
            )}

            <Box
              className="kv-row-actions"
              sx={{ width: 32, display: 'flex', justifyContent: 'center' }}
            >
              <Tooltip title="删除该行">
                <IconButton size="small" onClick={() => remove(item.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        );
      })}

      <Box sx={{ px: 0.5, py: 0.5 }}>
        <IconButton size="small" color="primary" onClick={add}>
          <AddIcon fontSize="small" />
          <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
            添加一行
          </Typography>
        </IconButton>
      </Box>
    </Box>
  );
}

/** 请求体编辑：none / form-data / x-www-form-urlencoded / raw(JSON/Text/XML)。 */
export default function BodyTab({ tab }: BodyTabProps): JSX.Element {
  const updateRequest = useTabsStore((s) => s.updateRequest);
  const showToast = useUiStore((s) => s.showToast);
  const request = tab.request;

  const handleFormatJson = () => {
    const result = prettyJson(request.rawBody);
    if (result.ok) {
      updateRequest(tab.id, { rawBody: result.text });
      showToast('已格式化 JSON');
    } else {
      showToast(result.reason ?? 'JSON 解析失败', 'error');
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={request.bodyType}
        onChange={(_event, value: BodyType | null) => {
          if (value) updateRequest(tab.id, { bodyType: value });
        }}
        sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}
      >
        {BODY_TYPES.map((bodyType) => (
          <ToggleButton
            key={bodyType.value}
            value={bodyType.value}
            sx={{
              py: 0.25,
              px: 1.25,
              fontSize: 12,
              textTransform: 'none',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {bodyType.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {request.bodyType === 'none' && (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            该请求没有 Body
          </Typography>
        </Box>
      )}

      {(request.bodyType === 'form-data' || request.bodyType === 'x-www-form-urlencoded') && (
        <FormDataEditor
          items={request.formData}
          allowFile={request.bodyType === 'form-data'}
          onChange={(formData) => updateRequest(tab.id, { formData })}
        />
      )}

      {isRawType(request.bodyType) && (
        <Box>
          {request.bodyType === 'raw-json' && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
              <Button size="small" startIcon={<FormatIcon />} onClick={handleFormatJson}>
                格式化
              </Button>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            minRows={10}
            value={request.rawBody}
            onChange={(e) => updateRequest(tab.id, { rawBody: e.target.value })}
            placeholder={
              request.bodyType === 'raw-json'
                ? '{"name": "postman-web"}'
                : '在此输入请求体内容…'
            }
            sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 12.5, lineHeight: 1.65 } }}
          />
        </Box>
      )}
    </Box>
  );
}
