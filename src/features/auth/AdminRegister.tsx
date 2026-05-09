import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { axiosClient as axios } from '../../lib/api';
import { useSnackbar } from '../../components/common/Snackbar';

export const AdminRegister: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('/auth/register', {
        ...formData,
        role: 'MERCHANT', // Explicitly register as merchant
      });
      showSnackbar('Registration successful! Please sign in.', 'success');
      navigate('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      showSnackbar(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
      <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem', color: '#111', fontWeight: 800 }}>Create Your Store</h1>
          <p style={{ margin: 0, color: '#666', fontSize: '1rem' }}>Join the marketplace and start selling today.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input 
                name="firstName"
                type="text" 
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input 
                name="lastName"
                type="text" 
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email Address</label>
            <input 
              name="email"
              type="email" 
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Phone Number</label>
            <input 
              name="phone"
              type="tel" 
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input 
              name="password"
              type="password" 
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              style={inputStyle}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            style={{ 
              padding: '14px', 
              background: '#111', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 700, 
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer', 
              marginTop: '1rem',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Creating Account...' : 'Register as Store Owner'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#111', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block', 
  marginBottom: '8px', 
  fontSize: '0.85rem', 
  fontWeight: 600, 
  color: '#444'
};

const inputStyle: React.CSSProperties = {
  width: '100%', 
  padding: '12px 16px', 
  border: '1px solid #e1e4e8', 
  borderRadius: '8px',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box'
};
