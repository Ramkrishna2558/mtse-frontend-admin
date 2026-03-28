import { BrowserRouter } from 'react-router-dom';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * All top-level providers go here.
 * Add Zustand stores, theme providers, auth context, etc.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}
