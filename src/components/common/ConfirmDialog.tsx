import type { ReactNode } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  content?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** 通用确认对话框；danger 时确认按钮为错误色。 */
export default function ConfirmDialog({
  open,
  title,
  content,
  confirmText = '确定',
  cancelText = '取消',
  danger = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      {content != null && (
        <DialogContent>
          {typeof content === 'string' ? <DialogContentText>{content}</DialogContentText> : content}
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose}>{cancelText}</Button>
        <Button variant="contained" color={danger ? 'error' : 'primary'} onClick={onConfirm}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
