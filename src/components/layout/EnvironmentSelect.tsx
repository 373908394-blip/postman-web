import { Box, IconButton, MenuItem, Select, Tooltip, type SelectChangeEvent } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { useEnvironmentsStore } from '../../store/environmentsStore';
import { useUiStore } from '../../store/uiStore';

/**
 * 顶栏用的小型环境下拉：显示当前激活环境名（未选显示「无环境」），
 * 右侧图标可直接跳转到侧栏「环境」面板。
 */
export default function EnvironmentSelect(): JSX.Element {
  const environments = useEnvironmentsStore((s) => s.environments);
  const activeId = useEnvironmentsStore((s) => s.activeId);
  const setActiveId = useEnvironmentsStore((s) => s.setActiveId);
  const setSidebarTab = useUiStore((s) => s.setSidebarTab);

  const handleChange = (event: SelectChangeEvent): void => {
    setActiveId(event.target.value || null);
  };

  return (
    <Box className="flex items-center gap-1">
      <Select
        size="small"
        value={activeId ?? ''}
        onChange={handleChange}
        displayEmpty
        renderValue={(value) => {
          const id = typeof value === 'string' ? value : '';
          return id ? environments.find((env) => env.id === id)?.name ?? '无环境' : '无环境';
        }}
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="">无环境</MenuItem>
        {environments.map((env) => (
          <MenuItem key={env.id} value={env.id}>
            {env.name}
          </MenuItem>
        ))}
      </Select>
      <Tooltip title="管理环境">
        <IconButton size="small" onClick={() => setSidebarTab('environments')}>
          <TuneIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
