import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useSnackbar } from '../../components/common/Snackbar';
import { useNavigate, Link } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
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
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#444' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px' }}
              required
            />
          </div>

          <button 
            type="submit"
            style={{ padding: '14px', background: '#111', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }}
          >
            Sign In
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
          Don't have a store? <Link to="/register" style={{ color: '#111', fontWeight: 700, textDecoration: 'none' }}>Register Now</Link>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px', fontSize: '0.8rem', color: '#666' }}>
          <strong>Demo Login Hints:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li><code>admin@platform.com</code> / <code>1234</code> - Sees ALL</li>
            <li><code>fashion@merchant.com</code> / <code>1234</code> - Sees ONLY fashion</li>
            <li><code>tech@merchant.com</code> / <code>1234</code> - Sees ONLY tech</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
