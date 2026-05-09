import React, { useState, useEffect } from 'react';
import { axiosClient as axios } from '../../lib/api';
import { DynamicTable } from '../../components/common/DynamicTable';
import { DynamicForm } from '../../components/common/DynamicForm';
import { storeTableConfig, storeFormConfig, type StoreFormValues } from './store.config';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { hasRole } from '../../../../mtse-shared/src/auth';
import { useSnackbar } from '../../components/common/Snackbar';

const API_URL = '/tenants'; // Using the real backend endpoint

export const StoreManager: React.FC = () => {
  const { user } = useAdminAuth();
  const { showSnackbar } = useSnackbar();
  const isPlatformAdmin = hasRole(user, 'platform_admin');

  const [globalStores, setGlobalStores] = useState<StoreFormValues[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'advanced'>('general');
  const [selectedStore, setSelectedStore] = useState<StoreFormValues | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await axios.get<any[]>(API_URL);
      const mappedStores = response.data.map((store: any) => ({
        ...store,
        tenantId: store.tenantId || store.id
      }));
      setGlobalStores(mappedStores);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrUpdate = async (values: Record<string, unknown>) => {
    const updatedValues = values as unknown as StoreFormValues;
    try {
      if (isAdding) {
        // Creating a new store
        await axios.post(API_URL, {
          ...updatedValues,
          adminEmail: user?.email, // Link to current user
        });
        showSnackbar('Store successfully created!', 'success');
      } else {
        // Editing existing store
        const id = isPlatformAdmin ? updatedValues.tenantId : selectedStore?.tenantId;
        await axios.put(`${API_URL}/${id}`, updatedValues);
        showSnackbar('Store settings updated successfully!', 'success');
      }
      setIsAdding(false);
      setSelectedStore(null);
      fetchStores();
    } catch (error) {
      console.error('Failed to save store configuration', error);
      showSnackbar('Failed to save changes.', 'error');
    }
  };

  const handleDeleteStore = async () => {
    const storeToDelete = isPlatformAdmin ? null : selectedStore;
    const storeId = storeToDelete?.tenantId;
    if (!storeId) return;

    const confirmDelete = window.confirm("Are you sure you want to delete this store? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/${storeId}`);
      showSnackbar("Store successfully deactivated.", 'success');
      setSelectedStore(null);
      fetchStores();
    } catch (error) {
      console.error('Failed to delete store', error);
      showSnackbar('Failed to deactivate store.', 'error');
    }
  };

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>⚙️ Loading settings...</div>;

  const myStores = globalStores.filter(s => s.email === user?.email);

  // 1. MERCHANT VIEW
  if (!isPlatformAdmin) {
    if (selectedStore) {
      return (
        <div style={{ padding: '3rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
          <button onClick={() => setSelectedStore(null)} style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
            ← Back to Stores
          </button>
          <header style={{ marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 8px 0' }}>{selectedStore.name} Settings</h1>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>Manage your brand identity and storefront configuration.</p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '3rem' }}>
            {/* Sidebar Tabs */}
            <aside>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} label="General" icon="⚙️" />
                <TabButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')} label="Branding" icon="🎨" />
                <TabButton active={activeTab === 'advanced'} onClick={() => setActiveTab('advanced')} label="Advanced" icon="🚀" />
              </nav>
              
              <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
                <button 
                  onClick={handleDeleteStore}
                  style={{ background: 'none', border: 'none', color: '#ff4d4f', fontWeight: 600, cursor: 'pointer', padding: '10px', fontSize: '0.9rem' }}
                >
                  Deactivate Store
                </button>
              </div>
            </aside>

            {/* Main Form Content */}
            <div style={{ background: 'white', padding: '3rem', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.4rem', fontWeight: 700 }}>
                {activeTab === 'general' ? 'General Information' : activeTab === 'branding' ? 'Brand Visuals' : 'Advanced Configuration'}
              </h3>
              
              <DynamicForm 
                config={storeFormConfig} 
                initialValues={selectedStore as any}
                onSubmit={handleAddOrUpdate}
              />
            </div>
          </div>
        </div>
      );
    }

    // Show list of stores for merchant
    return (
      <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#111' }}>My Stores</h1>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '1.1rem' }}>Manage your tenant storefronts.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            style={{ background: '#000', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
          >
            + New Store
          </button>
        </header>

        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <DynamicTable 
            config={storeTableConfig} 
            data={myStores} 
            onRowClick={(row) => setSelectedStore(row as any)}
          />
        </div>

        {myStores.length === 0 && (
          <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏪</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>No Store Found</h2>
            <p style={{ color: '#666', maxWidth: '500px', margin: '0 auto 2rem' }}>
              It seems you haven't created a store yet. Click "+ New Store" to get started.
            </p>
          </div>
        )}

        {isAdding && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
            <div style={{ background: 'white', padding: '3rem', borderRadius: '24px', width: '100%', maxWidth: '650px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Provision New Store</h2>
                <p style={{ color: '#666', marginTop: '8px' }}>Create a new tenant environment.</p>
              </div>
              
              <DynamicForm 
                config={storeFormConfig} 
                onSubmit={handleAddOrUpdate}
                onCancel={() => setIsAdding(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. PLATFORM ADMIN VIEW (Table View)
  return (
    <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, color: '#111' }}>Stores</h1>
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: '1.1rem' }}>Monitor and manage all tenant storefronts.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          style={{ background: '#000', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
        >
          + New Store
        </button>
      </header>

      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <DynamicTable 
          config={storeTableConfig} 
          data={globalStores} 
          onRowClick={(row) => console.log('Admin auditing store:', row)}
        />
      </div>

      {isAdding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: 'white', padding: '3rem', borderRadius: '24px', width: '100%', maxWidth: '650px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Provision New Store</h2>
              <p style={{ color: '#666', marginTop: '8px' }}>Create a new tenant environment.</p>
            </div>
            
            <DynamicForm 
              config={storeFormConfig} 
              onSubmit={handleAddOrUpdate}
              onCancel={() => setIsAdding(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, label: string, icon: string }> = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 20px',
      borderRadius: '10px',
      border: 'none',
      background: active ? '#000' : 'transparent',
      color: active ? '#fff' : '#666',
      fontWeight: 600,
      fontSize: '1rem',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s ease'
    }}
  >
    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
    {label}
  </button>
);
