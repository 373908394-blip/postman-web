import { Box, MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import type { HttpMethod } from '../../types';
import { HTTP_METHODS } from '../../types';

interface MethodSelectProps {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

/** 方法 → 语义色 */
const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#2e9e5b',
  POST: '#d9822b',
  PUT: '#1a73e8',
  PATCH: '#a626a4',
  DELETE: '#d64545',
  HEAD: '#8a8f98',
  OPTIONS: '#8a8f98',
};

/** HTTP 方法选择器（等宽字体 + 按方法着色）。 */
export default function MethodSelect({ value, onChange }: MethodSelectProps): JSX.Element {
  const handleChange = (event: SelectChangeEvent) => onChange(event.target.value as HttpMethod);

  return (
    <Select
      value={value}
      onChange={handleChange}
      sx={{ width: 110, fontFamily: 'monospace', fontWeight: 700 }}
      renderValue={(selected) => (
        <Box component="span" sx={{ color: METHOD_COLORS[selected as HttpMethod], fontSize: 13 }}>
          {selected as string}
        </Box>
      )}
    >
      {HTTP_METHODS.map((method) => (
        <MenuItem key={method} value={method}>
          <Box
            component="span"
            sx={{
              color: METHOD_COLORS[method],
              fontWeight: 700,
              fontFamily: 'monospace',
              fontSize: 13,
            }}
          >
            {method}
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
}
