import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import type { RequestTab } from '../../types';
import { useCollectionsStore } from '../../store/collectionsStore';
import { useTabsStore } from '../../store/tabsStore';
import { useUiStore } from '../../store/uiStore';

interface SaveToCollectionDialogProps {
  open: boolean;
  tab: RequestTab;
  onClose: () => void;
}

/**
 * 把当前标签的请求保存到集合：可命名、选择目标集合或就地新建集合。
 * - 已关联保存来源（savedRequestId + collectionId）→ 更新原条目；
 * - 否则在目标集合新增一条并回写关联（markSaved）。
 */
export default function SaveToCollectionDialog({
  open,
  tab,
  onClose,
}: SaveToCollectionDialogProps): JSX.Element {
  const collections = useCollectionsStore((s) => s.collections);
  const addCollection = useCollectionsStore((s) => s.addCollection);
  const addRequest = useCollectionsStore((s) => s.addRequest);
  const updateSavedRequest = useCollectionsStore((s) => s.updateSavedRequest);
  const markSaved = useTabsStore((s) => s.markSaved);
  const showToast = useUiStore((s) => s.showToast);

  const [name, setName] = useState(tab.name);
  const [collectionId, setCollectionId] = useState(tab.collectionId ?? '');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // 每次打开时重置表单默认值
  useEffect(() => {
    if (!open) return;
    setName(tab.name || tab.request.name || '未命名请求');
    const exists = collections.some((c) => c.id === tab.collectionId);
    setCollectionId(exists && tab.collectionId ? tab.collectionId : collections[0]?.id ?? '');
    setCreatingNew(collections.length === 0);
    setNewCollectionName('');
    // 仅在打开或标签变化时同步默认值
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab.id]);

  const handleCreateCollection = (): void => {
    const value = newCollectionName.trim();
    if (!value) return;
    const id = addCollection(value);
    setCollectionId(id);
    setCreatingNew(false);
    setNewCollectionName('');
  };

  const handleSave = (): void => {
    const finalName = name.trim() || tab.request.name || '未命名请求';
    const targetCollectionId = collectionId;
    if (!targetCollectionId) {
      showToast('请选择目标集合', 'warning');
      return;
    }
    const request = { ...tab.request, name: finalName };

    if (tab.savedRequestId && tab.collectionId) {
      updateSavedRequest(tab.collectionId, tab.savedRequestId, { name: finalName, request });
      markSaved(tab.id, tab.savedRequestId, tab.collectionId, finalName);
    } else {
      const newId = addRequest(targetCollectionId, finalName, request);
      markSaved(tab.id, newId, targetCollectionId, finalName);
    }

    showToast('已保存到集合');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>保存到集合</DialogTitle>
      <DialogContent className="flex flex-col gap-3" sx={{ pt: 1 }}>
        <TextField
          label="请求名称"
          size="small"
          fullWidth
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {creatingNew ? (
          <Box className="flex items-end gap-2">
            <TextField
              label="新集合名称"
              size="small"
              fullWidth
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateCollection();
              }}
            />
            <Button
              variant="outlined"
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
            >
              创建
            </Button>
          </Box>
        ) : (
          <Box className="flex flex-col gap-1">
            <Typography variant="caption" color="text.secondary">
              目标集合
            </Typography>
            <Select
              size="small"
              fullWidth
              displayEmpty
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
            >
              {collections.length === 0 && <MenuItem value="">{'（暂无集合）'}</MenuItem>}
              {collections.map((col) => (
                <MenuItem key={col.id} value={col.id}>
                  {col.name}
                </MenuItem>
              ))}
            </Select>
            <Button
              size="small"
              onClick={() => setCreatingNew(true)}
              sx={{ alignSelf: 'flex-start' }}
            >
              + 新建集合并保存
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSave} disabled={!collectionId}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
