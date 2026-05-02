import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import { SnackbarProvider } from '../components/common/Snackbar';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SnackbarProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AdminAuthProvider>
    </SnackbarProvider>
  );
}
