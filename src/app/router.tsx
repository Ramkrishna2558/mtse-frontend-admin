import { Routes, Route } from 'react-router-dom';

function DashboardPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome to the MTSE Admin Panel</p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div>
      <h1>404</h1>
      <p>Page not found</p>
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
