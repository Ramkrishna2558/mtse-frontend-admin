import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useSnackbar } from '../../components/common/Snackbar';
import { useNavigate } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'platform_admin' | 'merchant'>('merchant');

  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, role);
      showSnackbar('Login successful. Redirecting to dashboard...', 'success');
      navigate('/'); // redirect to dashboard
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      showSnackbar(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', color: '#111' }}>MTSE Admin</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Sign in to manage your storefronts</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#444' }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@platform.com or merchant..."
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#444' }}>Role (Demo bypass)</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value as any)}
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', background: 'white' }}
            >
              <option value="merchant">Store Merchant</option>
              <option value="platform_admin">Platform Admin</option>
            </select>
          </div>

          <button 
            type="submit"
            style={{ padding: '14px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }}
          >
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px', fontSize: '0.8rem', color: '#666' }}>
          <strong>Demo Login Hints:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li><code>admin@platform.com</code> - Sees ALL stores</li>
            <li><code>fashion@merchant.com</code> - Sees ONLY fashion store</li>
            <li><code>tech@merchant.com</code> - Sees ONLY tech store</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
