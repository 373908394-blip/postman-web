import { useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useUiStore } from '../../store/uiStore';

/** 全局轻提示。所有 showToast 调用都会在这里落地。 */
export default function ToastHost() {
  const toast = useUiStore((s) => s.toast);
  const closeToast = useUiStore((s) => s.closeToast);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => closeToast(), 2600);
    return () => window.clearTimeout(timer);
  }, [toast, closeToast]);

  return (
    <Snackbar
      open={!!toast}
      autoHideDuration={2600}
      onClose={closeToast}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={toast?.severity ?? 'success'}
        variant="filled"
        onClose={closeToast}
        sx={{ fontSize: 13, py: 0.5 }}
      >
        {toast?.message}
      </Alert>
    </Snackbar>
  );
}
