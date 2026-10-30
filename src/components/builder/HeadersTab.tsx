import { Box } from '@mui/material';
import type { RequestTab } from '../../types';
import { useTabsStore } from '../../store/tabsStore';
import KeyValueEditor from '../common/KeyValueEditor';

interface HeadersTabProps {
  tab: RequestTab;
}

/** 请求头编辑（带描述列）。 */
export default function HeadersTab({ tab }: HeadersTabProps): JSX.Element {
  const updateRequest = useTabsStore((s) => s.updateRequest);

  return (
    <Box sx={{ p: 1 }}>
      <KeyValueEditor
        rows={tab.request.headers}
        onChange={(headers) => updateRequest(tab.id, { headers })}
        keyLabel="Header"
        valueLabel="值"
        keyPlaceholder="例如 Content-Type"
        valuePlaceholder="例如 application/json"
        showDescription
        emptyHint="暂无自定义请求头；Content-Type 会按 Body 类型自动补充。"
      />
    </Box>
  );
}
