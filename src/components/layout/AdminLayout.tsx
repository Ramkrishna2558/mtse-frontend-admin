import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { hasRole } from '../../../../mtse-shared/src/auth';
import { axiosClient as axios } from '../../lib/api';

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isPlatformAdmin = hasRole(user, 'platform_admin');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f9fafb' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{ width: '260px', background: '#111', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '24px', background: 'var(--primary-color, white)', borderRadius: '4px' }}></div>
            MTSE Admin
          </h2>
          <p style={{ margin: '5px 0 0', fontSize: '0.8rem', opacity: 0.6, textTransform: 'capitalize' }}>
            {isPlatformAdmin ? 'Platform View' : `Tenant: ${user?.tenantId}`}
          </p>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 0' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <Link to="/" style={{ display: 'block', padding: '12px 1.5rem', color: 'white', textDecoration: 'none', opacity: 0.8 }}>
                📊 Dashboard
              </Link>
            </li>
            {isPlatformAdmin && (
              <li>
                <Link to="/stores" style={{ display: 'block', padding: '12px 1.5rem', color: 'white', textDecoration: 'none', opacity: 0.8 }}>
                  🏪 All Stores
                </Link>
              </li>
            )}
            {!isPlatformAdmin && (
              <li>
                <Link to="/settings" style={{ display: 'block', padding: '12px 1.5rem', color: 'white', textDecoration: 'none', opacity: 0.8 }}>
                  ⚙️ Store Settings
                </Link>
              </li>
            )}
            <li>
              <Link to="/products" style={{ display: 'block', padding: '12px 1.5rem', color: 'white', textDecoration: 'none', opacity: 0.8 }}>
                📦 Product Inventory
              </Link>
            </li>
            <li>
              <Link to="/orders" style={{ display: 'block', padding: '12px 1.5rem', color: 'white', textDecoration: 'none', opacity: 0.8 }}>
                🛍️ Orders
              </Link>
            </li>
          </ul>
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '0.85rem', marginBottom: '1rem', opacity: 0.8 }}>
            Logged in as:<br/><strong>{user?.email}</strong>
          </div>
          <button 
            onClick={logout}
            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
          >
            Sign Out
          </button>

          {isPlatformAdmin && (
            <button 
              onClick={async () => {
                try {
                  await axios.post('/analytics/seed-demo');
                  alert('Demo data successfully re-seeded!');
                  window.location.reload();
                } catch (err) {
                  alert('Failed to seed demo data. Please check backend.');
                }
              }}
              style={{ width: '100%', padding: '10px', background: '#ff6b35', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', marginTop: '1rem', fontWeight: 600 }}
            >
              🌱 Reset Demo Data
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
      
    </div>
  );
};
