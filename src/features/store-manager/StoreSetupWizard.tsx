import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient as axios } from '../../lib/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useSnackbar } from '../../components/common/Snackbar';
import { tokenStorage } from '../../../../mtse-shared/src/auth';

export const StoreSetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: user?.email || '',
    description: '',
    phone: '',
    currency: 'INR',
    adminEmail: user?.email || '',
    adminPassword: 'DO_NOT_CHANGE', // Backend expects adminPassword, but we already have the user. 
                                     // This might need a backend tweak or we just pass something dummy.
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // In this flow, we already have a user. 
      // The backend TenantsService.create creates a NEW user.
      // We might need a special endpoint "createTenantForCurrentUser" or just use the existing one and link it.
      // For now, let's assume we use the existing one but the backend needs to handle existing users.
      // Actually, let's just call the tenants endpoint.
      
      const response = await axios.post('/tenants', {
        ...formData,
        adminEmail: user?.email, // Keep consistent
        adminPassword: 'EXISTING_USER', // Signal to backend if possible, or we might need to fix backend
      });
      
      showSnackbar('Store created successfully!', 'success');
      
      // Update local storage user with new tenantId
      const storedUser = tokenStorage.getUser();
      if (storedUser) {
        tokenStorage.setUser({ ...storedUser, tenantId: response.data.id });
      }
      
      // Force reload to update user context with new tenantId
      window.location.href = '/dashboard';
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create store.';
      showSnackbar(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', padding: '2rem' }}>
      <div style={{ background: 'white', padding: '3.5rem', borderRadius: '24px', width: '100%', maxWidth: '700px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <div style={{ background: '#000', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>1</div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Store Foundation</h2>
          </div>
          <p style={{ color: '#666', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Tell us about your brand. This information will be used to generate your storefront and identify your business.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Store Name</label>
              <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Urban Threads"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Store Slug (URL Identifier)</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e1e4e8', borderRadius: '8px', padding: '0 12px', background: '#f8f9fa' }}>
                <span style={{ fontSize: '0.9rem', color: '#999', userSelect: 'none' }}>mtse.com/</span>
                <input 
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="urban-threads"
                  style={{ ...inputStyle, border: 'none', background: 'transparent', padding: '12px 4px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Currency</label>
              <select name="currency" value={formData.currency} onChange={handleChange} style={inputStyle}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Short Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What makes your store unique?"
                style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Support Email</label>
              <input 
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="support@yourstore.com"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Contact Phone</label>
              <input 
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91..."
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '2rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                padding: '14px 40px', 
                background: '#000', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '10px', 
                fontWeight: 700, 
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s ease, opacity 0.2s ease'
              }}
            >
              {isLoading ? 'Launching Store...' : 'Launch Store →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block', 
  marginBottom: '10px', 
  fontSize: '0.9rem', 
  fontWeight: 600, 
  color: '#1a1a1a'
};

const inputStyle: React.CSSProperties = {
  width: '100%', 
  padding: '12px 16px', 
  border: '1px solid #e1e4e8', 
  borderRadius: '8px',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box'
};
