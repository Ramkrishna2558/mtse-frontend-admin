import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DynamicTable } from '../../components/common/DynamicTable';
import { DynamicForm } from '../../components/common/DynamicForm';
import { storeTableConfig, storeFormConfig, type StoreFormValues } from './store.config';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { hasRole } from '../../../../mtse-shared/src/auth';

const API_URL = 'http://localhost:3000/stores';

export const StoreManager: React.FC = () => {
  const { user } = useAdminAuth();
  const isPlatformAdmin = hasRole(user, 'platform_admin');

  const [globalStores, setGlobalStores] = useState<StoreFormValues[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    axios.get<StoreFormValues[]>(API_URL)
      .then(response => {
        setGlobalStores(response.data);
      })
      .catch(error => {
        console.error('Error fetching stores:', error);
      });
  }, []);

  // If a merchant, try to find their exactly linked store
  const myStore = !isPlatformAdmin && user?.tenantId 
    ? globalStores.find(s => s.tenantId === user.tenantId) 
    : null;

  const handleAddOrUpdate = async (values: Record<string, unknown>) => {
    const updatedValues = values as unknown as StoreFormValues;
    try {
      if (isPlatformAdmin || !myStore) {
        // Mocking POST request since json-server auto-generates id if missing, we use tenantId as id.
        await axios.post(API_URL, { ...updatedValues, id: updatedValues.tenantId });
        setGlobalStores([...globalStores, updatedValues]);
      } else {
        // Editing existing store
        await axios.put(`${API_URL}/${updatedValues.tenantId}`, { ...updatedValues, id: updatedValues.tenantId });
        setGlobalStores(prev => prev.map(s => s.tenantId === updatedValues.tenantId ? updatedValues : s));
      }
      setIsAdding(false);
      alert('Store configuration successfully saved!');
    } catch (error) {
      console.error('Failed to save store configuration', error);
      alert('Failed to save store to database.');
    }
  };

  const handleDeleteStore = async () => {
    if (!myStore) return;
    const confirmDelete = window.confirm("Are you sure you want to delete your store? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/${myStore.tenantId}`);
      setGlobalStores(prev => prev.filter(s => s.tenantId !== myStore.tenantId));
      alert("Store successfully deleted.");
    } catch (error) {
      console.error('Failed to delete store', error);
      alert('Failed to delete store from database.');
    }
  };

  // 1. MERCHANT VIEW (Only sees their own store config form)
  if (!isPlatformAdmin) {
    if (!myStore && !isAdding) {
      return (
        <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
          <h2>Welcome, Merchant!</h2>
          <p>You haven't provisioned a storefront yet.</p>
          <button onClick={() => setIsAdding(true)} style={{ padding: '12px 24px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Setup Your Store Now
          </button>
        </div>
      );
    }

    // Merchant Editing their own Store
    return (
      <div style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Store Configuration</h2>
          <button onClick={handleDeleteStore} style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Delete Store
          </button>
        </div>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Update your brand identity perfectly tailored for your <code>{user?.tenantId || 'New'}</code> tenant.</p>
        
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
           <DynamicForm 
             config={storeFormConfig} 
             initialValues={myStore as any}
             onSubmit={handleAddOrUpdate}
           />
        </div>
      </div>
    );
  }

  // 2. PLATFORM ADMIN VIEW (Sees everything)
  return (
    <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#111' }}>Platform Stores</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.6 }}>Manage multi-tenant configuration and feature toggles.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          style={{ background: '#111', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
        >
          + Provision New Store
        </button>
      </header>

      <DynamicTable 
        config={storeTableConfig} 
        data={globalStores} 
        onRowClick={(row) => console.log('Admin auditing store:', row)}
      />

      {isAdding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem' }}>
          <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', width: '100%', maxWidth: '650px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111' }}>Provision New Store</h2>
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

