import { Routes, Route, Navigate } from 'react-router-dom';
import { StoreManager } from '../features/store-manager/StoreManager';
import { AdminLogin } from '../features/auth/AdminLogin';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ProductManager } from '../features/product-manager/ProductManager';
import { OrderManager } from '../features/order-manager/OrderManager';
import { Dashboard } from '../features/dashboard/Dashboard';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      
      {/* Protected Routes wrapped in AdminLayout */}
      <Route element={<AdminLayout />}>
        {/* Default route inside the dashboard */}
        <Route path="/" element={<Dashboard />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Only platform admin should technically see /stores, but StoreManager handles empty view for merchants */}
        <Route path="/stores" element={<StoreManager />} />
        <Route path="/settings" element={<StoreManager />} /> 
        
        {/* Products module */}
        <Route path="/products" element={<ProductManager />} />

        {/* Orders module */}
        <Route path="/orders" element={<OrderManager />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
