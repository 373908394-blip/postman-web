import { useState } from 'react';
import { Badge, Box, Tab, Tabs } from '@mui/material';
import type { RequestTab } from '../../types';
import UrlBar from './UrlBar';
import ParamsTab from './ParamsTab';
import HeadersTab from './HeadersTab';
import BodyTab from './BodyTab';
import AuthTab from './AuthTab';

type TabKey = 'params' | 'headers' | 'body' | 'auth';

interface RequestBuilderProps {
  tab: RequestTab;
}

const countEnabled = (rows: { enabled: boolean; key: string }[]): number =>
  rows.filter((row) => row.enabled && row.key.trim()).length;

/** 请求构建器：URL 栏 + Params / Headers / Body / Auth 子标签。 */
export default function RequestBuilder({ tab }: RequestBuilderProps): JSX.Element {
  const [tabKey, setTabKey] = useState<TabKey>('params');

  const paramsCount = countEnabled(tab.request.params);
  const headersCount = countEnabled(tab.request.headers);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <UrlBar tab={tab} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
        <Tabs
          value={tabKey}
          onChange={(_event, value: TabKey) => setTabKey(value)}
          sx={{ minHeight: 38 }}
        >
          <Tab
            value="params"
            sx={{ minHeight: 38 }}
            label={
              <Badge
                color="secondary"
                badgeContent={paramsCount}
                invisible={paramsCount === 0}
                sx={{ '& .MuiBadge-badge': { top: 6, right: -10 } }}
              >
                Params
              </Badge>
            }
          />
          <Tab
            value="headers"
            sx={{ minHeight: 38 }}
            label={
              <Badge
                color="secondary"
                badgeContent={headersCount}
                invisible={headersCount === 0}
                sx={{ '& .MuiBadge-badge': { top: 6, right: -10 } }}
              >
                Headers
              </Badge>
            }
          />
          <Tab value="body" sx={{ minHeight: 38 }} label="Body" />
          <Tab value="auth" sx={{ minHeight: 38 }} label="Auth" />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {tabKey === 'params' && <ParamsTab tab={tab} />}
        {tabKey === 'headers' && <HeadersTab tab={tab} />}
        {tabKey === 'body' && <BodyTab tab={tab} />}
        {tabKey === 'auth' && <AuthTab tab={tab} />}
      </Box>
    </Box>
  );
}
