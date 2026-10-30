import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InboxIcon from '@mui/icons-material/Inbox';
import WrapTextIcon from '@mui/icons-material/WrapText';
import type { RequestTab } from '../../types';
import { formatBytes, formatMs, statusColor } from '../../utils/format';
import { isProbablyJson, prettyJson } from '../../utils/jsonHighlight';
import { useSettingsStore } from '../../store/settingsStore';
import { useUiStore } from '../../store/uiStore';
import JsonViewer from './JsonViewer';

interface ResponsePaneProps {
  tab: RequestTab;
}

type Section = 'body' | 'headers' | 'cookies';
type BodyView = 'pretty' | 'raw' | 'preview';

/**
 * 响应面板：处理 loading / error / 空 / 有响应 四种状态；
 * 有响应时展示状态码、耗时、大小，并提供 Body / Headers / Cookies 三个分区。
 */
export default function ResponsePane({ tab }: ResponsePaneProps): JSX.Element {
  const wordWrapDefault = useSettingsStore((s) => s.settings.wordWrap);
  const showToast = useUiStore((s) => s.showToast);

  const [section, setSection] = useState<Section>('body');
  const [view, setView] = useState<BodyView>('pretty');
  const [wrap, setWrap] = useState<boolean>(wordWrapDefault);

  const response = tab.response;

  const pretty = useMemo(() => {
    if (!response) return null;
    if (!isProbablyJson(response.contentType, response.body)) return null;
    const result = prettyJson(response.body);
    return result.ok ? result.text : null;
  }, [response]);

  const cookies = useMemo(
    () =>
      response ? response.headers.filter(([name]) => name.toLowerCase() === 'set-cookie') : [],
    [response],
  );

  // 1) 发送中
  if (tab.loading) {
    return (
      <Box
        className="flex h-full flex-col items-center justify-center gap-3"
        sx={{ color: 'text.secondary' }}
      >
        <CircularProgress size={28} />
        <Typography variant="body2">发送中…</Typography>
      </Box>
    );
  }

  // 2) 出错
  if (tab.error) {
    return (
      <Box className="p-3">
        <Alert severity="error" sx={{ mb: 1 }}>
          {tab.error}
        </Alert>
        <Typography variant="caption" color="text.secondary">
          排查建议：常见原因包括跨域（CORS）限制、目标地址不可达或代理未启动。可在「设置」中启用并配置代理后重试，或检查 URL 与网络连接。
        </Typography>
      </Box>
    );
  }

  // 3) 空响应
  if (!response) {
    return (
      <Box
        className="flex h-full flex-col items-center justify-center gap-2"
        sx={{ color: 'text.secondary' }}
      >
        <InboxIcon sx={{ fontSize: 40, opacity: 0.5 }} />
        <Typography variant="body2">点击发送查看响应</Typography>
      </Box>
    );
  }

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(response.body);
      showToast('响应体已复制');
    } catch {
      showToast('复制失败', 'error');
    }
  };

  const isHtml = /text\/html/i.test(response.contentType);
  const bodyPre = (
    <pre className={`code-area${wrap ? ' wrap' : ''}`} style={{ margin: 0, padding: 12 }}>
      {response.body}
    </pre>
  );

  return (
    <Box className="flex h-full flex-col" sx={{ minHeight: 0 }}>
      {/* 状态栏 */}
      <Box
        className="flex flex-wrap items-center gap-2 px-3 py-1.5"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Chip
          size="small"
          color={statusColor(response.status)}
          label={`${response.status} ${response.statusText}`}
        />
        <Typography variant="caption" color="text.secondary">
          耗时 {formatMs(response.time)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          大小 {formatBytes(response.size)}
        </Typography>
        {response.truncated && (
          <Typography variant="caption" color="warning.main">
            响应体已截断
          </Typography>
        )}
      </Box>

      {/* 分区切换 + Body 视图工具 */}
      <Box className="flex items-center" sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
        <Tabs
          value={section}
          onChange={(_, value: Section) => setSection(value)}
          sx={{ minHeight: 36, flex: 1 }}
        >
          <Tab value="body" label="Body" sx={{ minHeight: 36, py: 0 }} />
          <Tab
            value="headers"
            label={`Headers (${response.headers.length})`}
            sx={{ minHeight: 36, py: 0 }}
          />
          <Tab
            value="cookies"
            label={`Cookies (${cookies.length})`}
            sx={{ minHeight: 36, py: 0 }}
          />
        </Tabs>

        {section === 'body' && (
          <Box className="flex items-center gap-1">
            <ToggleButtonGroup
              size="small"
              exclusive
              value={view}
              onChange={(_, value: BodyView | null) => value && setView(value)}
            >
              <ToggleButton value="pretty" sx={{ px: 1, py: 0.25, textTransform: 'none' }}>
                Pretty
              </ToggleButton>
              <ToggleButton value="raw" sx={{ px: 1, py: 0.25, textTransform: 'none' }}>
                Raw
              </ToggleButton>
              <ToggleButton value="preview" sx={{ px: 1, py: 0.25, textTransform: 'none' }}>
                Preview
              </ToggleButton>
            </ToggleButtonGroup>
            <Tooltip title={wrap ? '取消换行' : '自动换行'}>
              <IconButton
                size="small"
                color={wrap ? 'primary' : 'default'}
                onClick={() => setWrap((w) => !w)}
              >
                <WrapTextIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="复制响应体">
              <IconButton size="small" onClick={handleCopy}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* 内容区 */}
      <Box className="flex-1" sx={{ minHeight: 0, overflow: 'auto' }}>
        {section === 'body' && (
          <>
            {view === 'pretty' && (pretty !== null ? <JsonViewer text={pretty} wordWrap={wrap} /> : bodyPre)}
            {view === 'raw' && bodyPre}
            {view === 'preview' &&
              (isHtml ? (
                <iframe
                  title="响应预览"
                  srcDoc={response.body}
                  sandbox="allow-same-origin"
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              ) : (
                <Box
                  className="flex h-full items-center justify-center"
                  sx={{ color: 'text.secondary' }}
                >
                  <Typography variant="body2">该类型不支持预览</Typography>
                </Box>
              ))}
          </>
        )}

        {section === 'headers' && (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontFamily: 'monospace', width: '35%' }}>Header</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {response.headers.map(([name, value], index) => (
                <TableRow key={`${name}-${index}`}>
                  <TableCell sx={{ fontFamily: 'monospace', verticalAlign: 'top' }}>
                    {name}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {value}
                  </TableCell>
                </TableRow>
              ))}
              {response.headers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ color: 'text.secondary' }}>
                    无响应头
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {section === 'cookies' &&
          (cookies.length > 0 ? (
            <Box className="flex flex-col gap-2 p-3">
              {cookies.map(([name, value], index) => (
                <Box key={`${name}-${index}`}>
                  <Typography variant="caption" color="text.secondary">
                    {name}
                  </Typography>
                  <pre className="code-area wrap" style={{ margin: 0 }}>
                    {value}
                  </pre>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              className="flex h-full items-center justify-center"
              sx={{ color: 'text.secondary' }}
            >
              <Typography variant="body2">无 Cookie</Typography>
            </Box>
          ))}
      </Box>
    </Box>
  );
}
