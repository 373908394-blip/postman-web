import {
  Box,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { AuthConfig, AuthType, RequestTab } from '../../types';
import { useTabsStore } from '../../store/tabsStore';

interface AuthTabProps {
  tab: RequestTab;
}

const AUTH_OPTIONS: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'api-key', label: 'API Key' },
];

/** 鉴权配置：None / Bearer / Basic / API Key。 */
export default function AuthTab({ tab }: AuthTabProps): JSX.Element {
  const updateRequest = useTabsStore((s) => s.updateRequest);
  const auth = tab.request.auth;

  const patch = (next: Partial<AuthConfig>) => updateRequest(tab.id, { auth: { ...auth, ...next } });

  return (
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 560 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ width: 72, flexShrink: 0 }}>
          Auth 类型
        </Typography>
        <Select
          value={auth.type}
          onChange={(e) => patch({ type: e.target.value as AuthType })}
          sx={{ width: 220 }}
        >
          {AUTH_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {auth.type === 'none' && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          该请求不携带鉴权信息。
        </Typography>
      )}

      {auth.type === 'bearer' && (
        <TextField
          label="Token"
          value={auth.token}
          onChange={(e) => patch({ token: e.target.value })}
          fullWidth
          helperText="发送时会自动添加请求头 Authorization: Bearer <token>"
        />
      )}

      {auth.type === 'basic' && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            label="用户名"
            value={auth.username}
            onChange={(e) => patch({ username: e.target.value })}
            fullWidth
          />
          <TextField
            label="密码"
            type="password"
            value={auth.password}
            onChange={(e) => patch({ password: e.target.value })}
            fullWidth
          />
        </Box>
      )}

      {auth.type === 'api-key' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="Key"
            value={auth.key}
            onChange={(e) => patch({ key: e.target.value })}
            fullWidth
          />
          <TextField
            label="Value"
            value={auth.value}
            onChange={(e) => patch({ value: e.target.value })}
            fullWidth
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              添加到
            </Typography>
            <RadioGroup
              row
              value={auth.addTo}
              onChange={(e) => patch({ addTo: e.target.value as 'header' | 'query' })}
            >
              <FormControlLabel value="header" control={<Radio size="small" />} label="Header" />
              <FormControlLabel value="query" control={<Radio size="small" />} label="Query Params" />
            </RadioGroup>
          </Box>
        </Box>
      )}
    </Box>
  );
}
