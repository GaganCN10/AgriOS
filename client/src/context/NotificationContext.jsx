import React, { createContext, useContext, useState, useCallback } from 'react';
import UserFriendlyAlert from '../components/UserFriendlyAlert';
import { getFriendlyError } from '../utils/errorMessages';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
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

  return (
    <NotificationContext.Provider value={{ notification, notify, notifySuccess, clearNotification }}>
      {children}
      {notification && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, maxWidth: 420, width: '90%' }}>
          <UserFriendlyAlert
            type={notification.type}
            title={notification.title}
            message={notification.message}
            remedy={notification.remedy}
            onClose={clearNotification}
          />
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};
