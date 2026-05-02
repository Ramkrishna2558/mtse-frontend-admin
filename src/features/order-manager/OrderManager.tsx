import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { DynamicTable } from '../../components/common/DynamicTable';
import { createTableConfig } from '../../../../mtse-shared/src/tables';

const API_URL = 'http://localhost:3000/orders';

export const OrderManager: React.FC = () => {
  const { user } = useAdminAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    // Fetch orders from JSON server
    axios.get<any[]>(API_URL)
      .then(response => {
        setOrders(response.data);
      })
      .catch(error => {
        console.error('Error fetching orders:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // TENANT ISOLATION: Filter orders so merchants only see their own.
  const myOrders = user?.roles.includes('platform_admin') 
    ? orders 
    : orders.filter(o => o.tenantId === user?.tenantId);

  // Table Config
  const orderTableConfig = createTableConfig<any>([
    { key: 'id', label: 'Order ID', width: '150px', render: (val) => <code style={{background:'#eee', padding:'2px 4px'}}>{String(val)}</code> },
    { key: 'customerEmail', label: 'Customer', sortable: true },
    { key: 'totalAmount', label: 'Total', render: (val) => `₹${Number(val).toLocaleString('en-IN')}` },
    { key: 'createdAt', label: 'Date', render: (val) => new Date(String(val)).toLocaleDateString('en-IN') },
    { key: 'status', label: 'Status', render: (val) => {
      const colors: any = {
        pending: { bg: '#fff7e6', text: '#d46b08', border: '#ffd591' },
        packing: { bg: '#e6f7ff', text: '#1890ff', border: '#91d5ff' },
        packed: { bg: '#f9f0ff', text: '#722ed1', border: '#d3adf7' },
        shipped: { bg: '#e6fffb', text: '#13c2c2', border: '#87e8de' },
        delivered: { bg: '#f6ffed', text: '#52c41a', border: '#b7eb8f' },
        cancelled: { bg: '#fff1f0', text: '#f5222d', border: '#ffa39e' }
      };
      const style = colors[val] || { bg: '#eee', text: '#666', border: '#ccc' };
      return (
        <span style={{ 
          padding: '4px 10px', 
          borderRadius: '12px', 
          fontSize: '0.75rem',
          fontWeight: 'bold',
          background: style.bg,
          color: style.text,
          border: `1px solid ${style.border}`,
          textTransform: 'uppercase'
        }}>
          {String(val)}
        </span>
      );
    } },
    { key: 'tenantId', label: 'Store (Tenant)', hidden: !user?.roles.includes('platform_admin') },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (_, row) => (
        <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(row); }} style={{ padding: '4px 8px', background: '#e6f7ff', color: '#1890ff', border: '1px solid #91d5ff', borderRadius: '4px', cursor: 'pointer' }}>View Details</button>
      )
    }
  ], 'id', { searchable: true, searchFields: ['id', 'customerEmail'], pageSize: 10, emptyMessage: 'No orders found.' });

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const order = orders.find(o => o.id === id);
      if (!order) return;
      const updatedOrder = { ...order, status };
      await axios.put(`${API_URL}/${id}`, updatedOrder);
      setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Failed to update order status', error);
      alert('Failed to update order status');
    }
  };

  return (
    <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Order Management</h1>
        <p style={{ opacity: 0.6, margin: '5px 0 0' }}>View and manage customer orders for {user?.roles.includes('platform_admin') ? 'All Stores' : user?.tenantId}</p>
      </header>

      <DynamicTable config={orderTableConfig} data={myOrders} isLoading={isLoading} />

      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
              <h2 style={{ margin: 0 }}>Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p><strong>Order ID:</strong> {selectedOrder.id}</p>
              <p><strong>Customer:</strong> {selectedOrder.customerEmail}</p>
              <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              <p>
                <strong>Status:</strong> <span style={{fontWeight: 700, color: '#ff6b35'}}>{selectedOrder.status.toUpperCase()}</span>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  {selectedOrder.status === 'pending' && (
                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'packing')} style={{ padding: '6px 12px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                      Start Packing
                    </button>
                  )}
                  {selectedOrder.status === 'packing' && (
                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'packed')} style={{ padding: '6px 12px', background: '#722ed1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                      Packing Done
                    </button>
                  )}
                  {selectedOrder.status === 'packed' && (
                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')} style={{ padding: '6px 12px', background: '#13c2c2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                      Dispatch Order
                    </button>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')} style={{ padding: '6px 12px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                      Mark Delivered
                    </button>
                  )}
                </div>
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem', background: '#fafafa', padding: '1rem', borderRadius: '8px', border: '1px solid #eee' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1a1a2e' }}>Shipping Address</h3>
              {selectedOrder.shippingAddress ? (
                <p style={{ margin: 0, color: '#555', lineHeight: '1.6', fontSize: '0.9rem' }}>
                  {selectedOrder.shippingAddress.flatNo}, {selectedOrder.shippingAddress.floor && `${selectedOrder.shippingAddress.floor} Floor, `}
                  {selectedOrder.shippingAddress.street}<br />
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}<br />
                  <strong>PIN: {selectedOrder.shippingAddress.pinCode}</strong><br />
                  <strong>Phone: {selectedOrder.phone}</strong>
                </p>
              ) : (
                <p style={{ margin: 0, color: '#999', fontStyle: 'italic' }}>{selectedOrder.address || 'Address not available'}</p>
              )}
            </div>

            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Items</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <li key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid #eee' : 'none' }}>
                    <img src={item.productImage || item.product?.images?.[0] || 'https://via.placeholder.com/50'} alt={item.productName || item.product?.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{item.productName || item.product?.name || 'Unknown Product'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#1a1a2e' }}>
                      ₹{Number(item.total || (item.product?.price * item.quantity) || (item.unitPrice * item.quantity)).toLocaleString('en-IN')}
                    </div>
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #eee', fontSize: '1.4rem', fontWeight: 800, color: '#ff6b35' }}>
                Total: ₹{Number(selectedOrder.totalAmount).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
