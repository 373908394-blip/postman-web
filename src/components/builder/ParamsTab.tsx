import { Box } from '@mui/material';
import type { RequestTab } from '../../types';
import { useTabsStore } from '../../store/tabsStore';
import KeyValueEditor from '../common/KeyValueEditor';

interface ParamsTabProps {
  tab: RequestTab;
}

/** Query 参数编辑：新增后会自动拼接到 URL 后面。 */
export default function ParamsTab({ tab }: ParamsTabProps): JSX.Element {
  const updateRequest = useTabsStore((s) => s.updateRequest);

  return (
    <Box sx={{ p: 1 }}>
      <KeyValueEditor
        rows={tab.request.params}
        onChange={(params) => updateRequest(tab.id, { params })}
        keyLabel="参数名"
        valueLabel="参数值"
        keyPlaceholder="例如 page"
        valuePlaceholder="例如 1"
        emptyHint="暂无 Query 参数；新增后会在发送时自动拼接到 URL 后面。"
      />
    </Box>
  );
}
