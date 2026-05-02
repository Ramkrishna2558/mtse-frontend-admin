import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

type SnackbarType = 'success' | 'error' | 'info' | 'warning';

interface SnackbarContextType {
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used within a SnackbarProvider');
  return context;
};

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snackbar, setSnackbar] = useState<{ message: string; type: SnackbarType; visible: boolean } | null>(null);

  const showSnackbar = useCallback((message: string, type: SnackbarType = 'success') => {
    setSnackbar({ message, type, visible: true });
  }, []);

  useEffect(() => {
    if (snackbar?.visible) {
      const timer = setTimeout(() => {
        setSnackbar(prev => prev ? { ...prev, visible: false } : null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbar]);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {snackbar?.visible && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: snackbar.type === 'success' ? '#2ecc71' : snackbar.type === 'error' ? '#e74c3c' : '#3498db',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 600,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <span>{snackbar.type === 'success' ? '✅' : snackbar.type === 'error' ? '❌' : 'ℹ️'}</span>
          {snackbar.message}
          <style>{`
            @keyframes slideUp {
              from { transform: translate(-50%, 20px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </SnackbarContext.Provider>
  );
};
