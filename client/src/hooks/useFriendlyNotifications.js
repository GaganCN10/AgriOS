import { useState, useCallback } from 'react';
import { getFriendlyError } from './errorMessages';

export function useFriendlyNotifications() {
  const [notification, setNotification] = useState(null);

  const notify = useCallback((errOrType, customTitle, customMessage, customRemedy) => {
    if (!errOrType) return;
    
    if (errOrType === 'success' || errOrType === 'error' || errOrType === 'info') {
      setNotification({
        type: errOrType,
        title: customTitle || '',
        message: customMessage || '',
        remedy: customRemedy || '',
      });
    } else {
      const friendly = getFriendlyError(errOrType);
      setNotification({
        type: 'error',
        title: customTitle || friendly.title,
        message: customMessage || friendly.message,
        remedy: customRemedy || friendly.remedy,
      });
    }
  }, []);

  const notifySuccess = useCallback((message, remedy) => {
    setNotification({ type: 'success', title: 'Success', message, remedy: remedy || '' });
  }, []);

  const clearNotification = useCallback(() => setNotification(null), []);

  return { notification, notify, notifySuccess, clearNotification };
}
