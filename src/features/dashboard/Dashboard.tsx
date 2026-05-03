import React, { useState, useEffect } from 'react';
import { axiosClient as axios } from '../../lib/api';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const tenantParam = user.tenantId ? `?tenantId=${user.tenantId}` : '';
    axios.get(`/analytics/dashboard${tenantParam}`)
      .then(res => {
        setStats(res.data);
      })
      .catch(err => console.error('Failed to fetch dashboard stats', err))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (isLoading) return <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>📊 Loading insights...</div>;
  if (!stats) return <div style={{ padding: '3rem', textAlign: 'center' }}>❌ Failed to load dashboard.</div>;

  const { revenue, orders, products, topProducts, recentOrders } = stats;

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, color: '#111' }}>Dashboard</h1>
        <p style={{ margin: '8px 0 0', color: '#666', fontSize: '1rem' }}>
          Welcome back, <span style={{ color: '#111', fontWeight: 600 }}>{user?.firstName}</span>. Here's what's happening with your store.
        </p>
      </header>

      {/* 4-Column Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard 
          title="Total Revenue" 
          value={`₹${revenue.total.toLocaleString()}`} 
          trend={revenue.profitMargin} 
          trendLabel="Margin"
          icon="💰" 
          color="#000"
          subValue={`Today: ₹${revenue.today.toLocaleString()}`}
        />
        <StatCard 
          title="Orders" 
          value={orders.total} 
          trend={orders.weekGrowth} 
          trendLabel="WoW Growth"
          icon="📦" 
          color="#111"
          subValue={`${orders.pending} Pending`}
        />
        <StatCard 
          title="Avg Order Value" 
          value={`₹${revenue.averageOrderValue.toLocaleString()}`} 
          icon="📈" 
          color="#111"
          subValue="Life-time average"
        />
        <StatCard 
          title="Total Products" 
          value={products.total} 
          icon="🏷️" 
          color="#111"
          subValue={`${products.lowStock.length} Low stock alerts`}
          highlight={products.lowStock.length > 0}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Recent Orders Table */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Recent Orders</h3>
            <button style={{ background: 'none', border: 'none', color: '#0070f3', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>View All →</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', color: '#999', fontWeight: 600 }}>ORDER</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', color: '#999', fontWeight: 600 }}>CUSTOMER</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', color: '#999', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '12px 8px', fontSize: '0.85rem', color: '#999', fontWeight: 600, textAlign: 'right' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #fafafa' }}>
                  <td style={{ padding: '16px 8px', fontSize: '0.9rem', fontWeight: 600 }}>#{order.orderNumber.split('-').pop()}</td>
                  <td style={{ padding: '16px 8px', fontSize: '0.9rem', color: '#555' }}>{order.customer.email}</td>
                  <td style={{ padding: '16px 8px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                      background: order.status === 'PENDING' ? '#fff7e6' : '#f6ffed',
                      color: order.status === 'PENDING' ? '#d46b08' : '#52c41a'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px', fontSize: '0.9rem', fontWeight: 700, textAlign: 'right' }}>₹{Number(order.totalAmount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Products */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 700 }}>Top Products</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {topProducts.map((p: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏷️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>{p.count} sales</div>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>₹{(p.count * 4500).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: any, icon: string, color: string, subValue: string, trend?: string, trendLabel?: string, highlight?: boolean }> = ({ title, value, icon, subValue, trend, trendLabel, highlight }) => (
  <div style={{ 
    background: 'white', 
    padding: '1.5rem', 
    borderRadius: '16px', 
    border: highlight ? '2px solid #ff4d4f' : '1px solid #eee',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0', color: '#111' }}>{value}</div>
      </div>
      <div style={{ fontSize: '1.5rem', background: '#f8f9fa', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>{icon}</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '0.85rem', color: highlight ? '#ff4d4f' : '#666', fontWeight: 500 }}>{subValue}</span>
      {trend && (
        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: '#f0f0f0', fontWeight: 700 }}>
          {trend} {trendLabel}
        </span>
      )}
    </div>
  </div>
);
