import { useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ContentCopy as CopyIcon, Send as SendIcon } from '@mui/icons-material';
import type { HttpMethod, RequestTab } from '../../types';
import { useTabsStore } from '../../store/tabsStore';
import { useActiveVariables } from '../../store/environmentsStore';
import { useUiStore } from '../../store/uiStore';
import { useSendRequest } from '../../hooks/useSendRequest';
import { buildFinalUrl } from '../../services/requestService';
import { findMissingVariables, resolveVariables } from '../../utils/variables';
import { toCurl } from '../../utils/curl';
import MethodSelect from './MethodSelect';

interface UrlBarProps {
  tab: RequestTab;
}

/** 请求地址栏：方法选择 + URL 输入 + 发送 + cURL 复制 + 解析预览。 */
export default function UrlBar({ tab }: UrlBarProps): JSX.Element {
  const updateRequest = useTabsStore((s) => s.updateRequest);
  const send = useSendRequest();
  const variables = useActiveVariables();
  const showToast = useUiStore((s) => s.showToast);

  const request = tab.request;

  const { preview, missing, changed } = useMemo(() => {
    const raw = request.url.trim();
    if (!raw) {
      return { preview: '', missing: [] as string[], changed: false };
    }
    let final = resolveVariables(raw, variables);
    try {
      final = buildFinalUrl(request, variables);
    } catch {
      final = resolveVariables(raw, variables);
    }
    return {
      preview: final,
      missing: findMissingVariables(raw, variables),
      changed: final !== raw,
    };
  }, [request, variables]);

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(toCurl(request));
      showToast('已复制 cURL 到剪贴板');
    } catch {
      showToast('复制失败，请检查浏览器剪贴板权限', 'error');
    }
  };

  return (
    <Box sx={{ px: 1.5, pt: 1.5, pb: 0.75, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MethodSelect
          value={request.method}
          onChange={(method: HttpMethod) => updateRequest(tab.id, { method })}
        />

        <TextField
          placeholder="输入请求 URL，支持 {{变量}}，例如 https://api.example.com/users"
          value={request.url}
          onChange={(e) => updateRequest(tab.id, { url: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !tab.loading) {
              e.preventDefault();
              void send(tab.id);
            }
          }}
          sx={{ flex: 1, '& input': { fontFamily: 'monospace', fontSize: 13 } }}
        />

        <Tooltip title="复制为 cURL 命令">
          <IconButton onClick={() => void handleCopyCurl()} aria-label="复制 cURL">
            <CopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          onClick={() => void send(tab.id)}
          disabled={tab.loading}
          startIcon={tab.loading ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
          sx={{ minWidth: 96 }}
        >
          {tab.loading ? '发送中…' : '发送'}
        </Button>
      </Box>

      {request.url.trim() && (
        <Box sx={{ pl: 0.5 }}>
          {changed && preview && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: 'text.secondary',
              }}
            >
              → {preview}
            </Typography>
          )}
          {missing.length > 0 && (
            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
              未定义变量：{missing.join('、')}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
