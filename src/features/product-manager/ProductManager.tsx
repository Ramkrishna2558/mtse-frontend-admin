import React, { useState, useRef, useEffect } from 'react';
import { axiosClient as axios } from '../../lib/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useSnackbar } from '../../components/common/Snackbar';
import { DynamicTable } from '../../components/common/DynamicTable';
import { createTableConfig } from '../../../../mtse-shared/src/tables';
import type { ProductDto } from '../../../../mtse-shared/src/types';
import { ProductForm } from './ProductForm';

const API_URL = '/products';

export const ProductManager: React.FC = () => {
  const { user } = useAdminAuth();
  const { showSnackbar } = useSnackbar();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch products
    axios.get<any>(API_URL)
      .then(response => {
        const data = response.data;
        setProducts((Array.isArray(data) ? data : data.items || []).map(p => {
          const firstVariantPrice = p.variants?.[0]?.price;
          const price = p.price !== undefined ? p.price : (firstVariantPrice !== undefined ? Number(firstVariantPrice) : 0);
          return {
            ...p,
            price: Number(price),
            category: typeof p.category === 'object' && p.category !== null ? p.category.name : p.category
          };
        }));
      })
      .catch(error => {
        console.error('Error fetching products:', error);
      });
  }, []);

  useEffect(() => {
    // Fetch categories if tenantId is available
    if (user?.tenantId) {
      axios.get<any>(`/categories?tenantId=${user.tenantId}`)
        .then(response => {
          setCategories(response.data);
        })
        .catch(error => {
          console.error('Error fetching categories:', error);
        });
    }
  }, [user?.tenantId]);

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

  // Custom form is now used, so we don't need dynamicAttributeFields or productFormConfig here.

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Failed to delete product", error);
      showSnackbar("Failed to delete product.", "error");
    }
  };

  const handleSaveProduct = async (productData: any) => {
    if (!user?.tenantId) {
      showSnackbar('Platform Admins must assign a tenant before adding products.', 'warning');
      return;
    }
    
    const finalData = {
      ...productData,
      tenantId: user.tenantId,
    };

    if (editingProduct) {
      try {
        const response = await axios.put(`${API_URL}/${editingProduct.id}`, finalData);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
          ...response.data,
          price: Number(response.data.variants?.[0]?.price || 0),
          category: typeof response.data.category === 'object' && response.data.category !== null ? response.data.category.name : response.data.category
        } : p));
        setEditingProduct(null);
        showSnackbar('Product updated successfully!', 'success');
      } catch (error) {
        console.error('Failed to update product', error);
        showSnackbar('Failed to update product', 'error');
      }
    } else {
      try {
        const response = await axios.post(API_URL, finalData);
        setProducts([...products, {
          ...response.data,
          price: Number(response.data.variants?.[0]?.price || 0),
          category: typeof response.data.category === 'object' && response.data.category !== null ? response.data.category.name : response.data.category
        }]);
        setIsAdding(false);
        showSnackbar('Product added successfully!', 'success');
      } catch (error) {
        console.error('Failed to add product', error);
        showSnackbar('Failed to save product to database', 'error');
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user?.tenantId) {
      showSnackbar('Platform Admins must assign a tenant before adding products.', 'warning');
      return;
    }

    // Mock processing the excel/csv file
    showSnackbar(`Processing file: ${file.name}... Parsing rows and saving to database...`, 'info');
    
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
      showSnackbar('Failed to save imported product to database', 'error');
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <ProductForm 
              initialValues={editingProduct}
              categories={categories}
              onSubmit={handleSaveProduct}
              onCancel={() => { setIsAdding(false); setEditingProduct(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

