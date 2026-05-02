import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { DynamicTable } from '../../components/common/DynamicTable';
import { DynamicForm } from '../../components/common/DynamicForm';
import { createTableConfig } from '../../../../mtse-shared/src/tables';
import { createFormConfig, type FieldConfig } from '../../../../mtse-shared/src/forms';
import type { ProductDto } from '../../../../mtse-shared/src/types';

const API_URL = 'http://localhost:3000/products';

export const ProductManager: React.FC = () => {
  const { user } = useAdminAuth();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch products from JSON server
    axios.get<ProductDto[]>(API_URL)
      .then(response => {
        setProducts(response.data);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
      });
  }, []);

  // TENANT ISOLATION: Filter products so merchants only see their own.
  const myProducts = user?.roles.includes('platform_admin') 
    ? products 
    : products.filter(p => p.tenantId === user?.tenantId);

  // 1. Table Config
  const productTableConfig = createTableConfig<ProductDto>([
    { key: 'id', label: 'ID', width: '80px', render: (val) => <code style={{background:'#eee', padding:'2px 4px'}}>{String(val)}</code> },
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'price', label: 'Price', render: (val) => `₹${Number(val).toLocaleString('en-IN')}` },
    { key: 'stock', label: 'Stock Level', render: (val) => <span style={{ color: Number(val) < 10 ? 'red' : 'green', fontWeight: 'bold' }}>{String(val)}</span> },
    { key: 'tenantId', label: 'Store (Tenant)', hidden: !user?.roles.includes('platform_admin') },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={(e) => { e.stopPropagation(); setEditingProduct(row); }} style={{ padding: '4px 8px', background: '#e6f7ff', color: '#1890ff', border: '1px solid #91d5ff', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
          <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(row.id); }} style={{ padding: '4px 8px', background: '#fff2f0', color: '#ff4d4f', border: '1px solid #ffa39e', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
        </div>
      ),
      hidden: !!user?.roles.includes('platform_admin')
    }
  ], 'id', { searchable: true, searchFields: ['name'], pageSize: 10, emptyMessage: 'Your inventory is empty.' });

  // 2. Form Config
  const dynamicAttributeFields: FieldConfig[] = user?.tenantId === 'fashion_store' ? [
    { name: 'attr_category', type: 'select', label: 'Category', options: [{label:'Dresses', value:'Dresses'}, {label:'Outerwear', value:'Outerwear'}], required: true },
    { name: 'attr_color', type: 'text', label: 'Color Variant', required: true },
    { name: 'attr_material', type: 'text', label: 'Material' }
  ] : user?.tenantId === 'tech_store' ? [
    { name: 'attr_type', type: 'select', label: 'Device Type', options: [{label:'Smartphone', value:'Smartphone'}, {label:'Laptop', value:'Laptop'}], required: true },
    { name: 'attr_storage', type: 'text', label: 'Storage Capacity' }
  ] : []; // If admin, complex logic needed to select tenant first, skipping for demo simplicity

  const productFormConfig = createFormConfig([
    { name: 'name', type: 'text', label: 'Product Name', required: true, colSpan: 2 },
    { name: 'price', type: 'number', label: 'Unit Price (₹)', required: true },
    { name: 'stock', type: 'number', label: 'Initial Stock Count', required: true },
    ...dynamicAttributeFields
  ], { columns: 2, submitLabel: 'List Product', resetLabel: 'Cancel' });

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Failed to delete product", error);
      alert("Failed to delete product.");
    }
  };

  const handleSaveProduct = async (values: Record<string, unknown>) => {
    if (!user?.tenantId) return alert('Platform Admins must assign a tenant before adding products.');
    
    // Extract dynamic attrs
    const attributes: Record<string, any> = {};
    Object.keys(values).forEach(key => {
      if (key.startsWith('attr_')) {
        attributes[key.replace('attr_', '')] = values[key];
      }
    });

    if (editingProduct) {
      const updatedProduct: ProductDto = {
        ...editingProduct,
        name: String(values.name),
        price: Number(values.price),
        stock: Number(values.stock),
        attributes,
        updatedAt: new Date().toISOString()
      };
      try {
        await axios.put(`${API_URL}/${editingProduct.id}`, updatedProduct);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p));
        setEditingProduct(null);
      } catch (error) {
        console.error('Failed to update product', error);
        alert('Failed to update product');
      }
    } else {
      const newProduct: ProductDto = {
        id: `prod_${Date.now()}`,
        name: String(values.name),
        price: Number(values.price),
        currency: 'INR',
        stock: Number(values.stock),
        status: 'active',
        tenantId: user.tenantId,
        attributes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await axios.post(API_URL, newProduct);
        setProducts([...products, newProduct]);
        setIsAdding(false);
      } catch (error) {
        console.error('Failed to add product', error);
        alert('Failed to save product to database');
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user?.tenantId) {
      alert('Platform Admins must assign a tenant before adding products.');
      return;
    }

    // Mock processing the excel/csv file
    alert(`Processing file: ${file.name}...\nParsing rows and saving to database...`);
    
    // Create a mock imported product
    const importedProduct: ProductDto = {
      id: `prod_${Date.now()}_imported`,
      name: `Imported Product (from ${file.name})`,
      price: (Math.floor(Math.random() * 100) + 10) * 80,
      currency: 'INR',
      stock: Math.floor(Math.random() * 50) + 5,
      status: 'active',
      tenantId: user.tenantId,
      attributes: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await axios.post(API_URL, importedProduct);
      setProducts(prev => [...prev, importedProduct]);
    } catch (error) {
      console.error('Failed to upload product', error);
      alert('Failed to save imported product to database');
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Product Inventory</h1>
          <p style={{ opacity: 0.6, margin: '5px 0 0' }}>Manage listings for {user?.roles.includes('platform_admin') ? 'All Stores' : user?.tenantId}</p>
        </div>
        {!user?.roles.includes('platform_admin') && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              style={{ background: '#f5f5f5', color: '#333', padding: '10px 20px', border: '1px solid #ddd', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📊 Upload Excel
            </button>
            <button 
              onClick={() => setIsAdding(true)} 
              style={{ background: '#0070f3', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              + Add One by One
            </button>
          </div>
        )}
      </header>

      <DynamicTable config={productTableConfig} data={myProducts} />

      {(isAdding || editingProduct) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>{editingProduct ? 'Edit Listing' : 'Create Listing'}</h2>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '2rem' }}>
              ℹ️ Notice how attributes automatically adapt (e.g. Memory vs Fabric) based on your Store configuration.
            </p>
            <DynamicForm 
              config={productFormConfig} 
              initialValues={editingProduct ? { ...editingProduct, ...Object.fromEntries(Object.entries(editingProduct.attributes || {}).map(([k,v]) => ['attr_'+k, v])) } as any : undefined}
              onSubmit={handleSaveProduct} 
              onCancel={() => { setIsAdding(false); setEditingProduct(null); }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

