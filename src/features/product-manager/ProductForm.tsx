import React, { useState, useEffect } from 'react';
import { useSnackbar } from '../../components/common/Snackbar';

interface Category {
  id: string;
  name: string;
}

interface ProductImage {
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

interface Variant {
  sku: string;
  name: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  stock: number;
  attributes?: Record<string, any>;
}

interface ProductFormProps {
  initialValues?: any;
  categories: Category[];
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialValues, categories, onSubmit, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'pricing' | 'variants'>('basic');
  const { showSnackbar } = useSnackbar();

  const handleNext = () => {
    // Validation for current tab
    if (activeTab === 'basic') {
      if (!name.trim()) {
        showSnackbar('Product Name is required', 'warning');
        return;
      }
    }
    
    if (activeTab === 'pricing') {
      if (!hasVariants) {
        if (price <= 0) {
          showSnackbar('Price must be greater than 0', 'warning');
          return;
        }
        if (stock < 0) {
          showSnackbar('Stock cannot be negative', 'warning');
          return;
        }
      }
    }

    const tabs: ('basic' | 'media' | 'pricing' | 'variants')[] = ['basic', 'media', 'pricing', 'variants'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const tabs: ('basic' | 'media' | 'pricing' | 'variants')[] = ['basic', 'media', 'pricing', 'variants'];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };
  
  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  // Media State
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // Pricing & Inventory (Simple Product)
  const [price, setPrice] = useState<number>(0);
  const [comparePrice, setComparePrice] = useState<number | undefined>(undefined);
  const [costPrice, setCostPrice] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState<number>(0);
  
  // Variants State
  const [hasVariants, setHasVariants] = useState(false);
  const [variantOptions, setVariantOptions] = useState<{ name: string, values: string[] }[]>([
    { name: 'Size', values: ['S', 'M', 'L'] },
    { name: 'Color', values: ['Red', 'Blue'] }
  ]);
  const [generatedVariants, setGeneratedVariants] = useState<Variant[]>([]);

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || '');
      setSlug(initialValues.slug || '');
      setDescription(initialValues.description || '');
      setShortDesc(initialValues.shortDesc || '');
      setCategoryId(initialValues.categoryId || '');
      setImages(initialValues.images || []);
      
      if (initialValues.variants && initialValues.variants.length > 0) {
        if (initialValues.variants.length === 1 && initialValues.variants[0].name === 'Default') {
          // Simple product mapped to 1 variant
          const def = initialValues.variants[0];
          setPrice(Number(def.price));
          setComparePrice(def.comparePrice ? Number(def.comparePrice) : undefined);
          setCostPrice(def.costPrice ? Number(def.costPrice) : undefined);
          setStock(Number(def.stock));
          setHasVariants(false);
        } else {
          setHasVariants(true);
          setGeneratedVariants(initialValues.variants);
          // We would need to reconstruct options from variants, but for simplicity we'll just keep the default UI options or let user edit variants directly
        }
      }
    }
  }, [initialValues]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!initialValues && name) {
      setSlug(name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
    }
  }, [name, initialValues]);

  // Generate variants from options
  useEffect(() => {
    if (hasVariants) {
      generateCombinations();
    }
  }, [variantOptions, hasVariants]);

  const generateCombinations = () => {
    // Simple Cartesian product generator
    const generate = (acc: any[], options: { name: string, values: string[] }[]): any[] => {
      if (options.length === 0) return acc;
      const current = options[0];
      const remaining = options.slice(1);
      
      if (acc.length === 0) {
        return generate(current.values.map(v => ({ [current.name]: v })), remaining);
      }
      
      const nextAcc: any[] = [];
      acc.forEach(a => {
        current.values.forEach(v => {
          nextAcc.push({ ...a, [current.name]: v });
        });
      });
      
      return generate(nextAcc, remaining);
    };

    const validOptions = variantOptions.filter(opt => opt.name && opt.values.length > 0);
    if (validOptions.length === 0) {
      setGeneratedVariants([]);
      return;
    }

    const combinations = generate([], validOptions);
    
    const newVariants: Variant[] = combinations.map(comb => {
      const variantName = Object.values(comb).join(' / ');
      const sku = `${slug}-${Object.values(comb).join('-')}`.toLowerCase();
      
      // Try to preserve existing variant data if name matches
      const existing = generatedVariants.find(v => v.name === variantName);
      if (existing) return existing;

      return {
        sku,
        name: variantName,
        price: price || 0,
        stock: 0,
        attributes: comb
      };
    });

    setGeneratedVariants(newVariants);
  };

  const handleAddImage = () => {
    if (!newImageUrl) return;
    setImages([...images, { url: newImageUrl, isPrimary: images.length === 0 }]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages(images.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      showSnackbar('Product Name is required', 'warning');
      setActiveTab('basic');
      return;
    }
    
    if (!hasVariants) {
      if (price <= 0) {
        showSnackbar('Price must be greater than 0', 'warning');
        setActiveTab('pricing');
        return;
      }
      if (stock < 0) {
        showSnackbar('Stock cannot be negative', 'warning');
        setActiveTab('pricing');
        return;
      }
    } else {
      const validOptions = variantOptions.filter(opt => opt.name.trim() && opt.values.length > 0);
      if (validOptions.length === 0) {
        showSnackbar('Please add at least one valid option (name and values) for variants', 'warning');
        setActiveTab('variants');
        return;
      }
      
      const invalidVariant = generatedVariants.find(v => v.price <= 0 || v.stock < 0);
      if (invalidVariant) {
        showSnackbar(`Please set valid price and stock for all variants. Error in: ${invalidVariant.name}`, 'warning');
        setActiveTab('variants');
        return;
      }
    }

    const productData: any = {
      name,
      slug,
      description,
      shortDesc,
      categoryId: categoryId || null,
      images,
    };

    if (hasVariants) {
      productData.variants = generatedVariants;
    } else {
      productData.variants = [{
        sku: `${slug}-${Date.now()}`,
        name: 'Default',
        price,
        comparePrice,
        costPrice,
        stock,
      }];
    }

    onSubmit(productData);
  };

  const addOption = () => {
    setVariantOptions([...variantOptions, { name: '', values: [] }]);
  };

  const updateOptionName = (index: number, name: string) => {
    const newOpts = [...variantOptions];
    newOpts[index].name = name;
    setVariantOptions(newOpts);
  };

  const updateOptionValues = (index: number, valuesStr: string) => {
    const newOpts = [...variantOptions];
    newOpts[index].values = valuesStr.split(',').map(v => v.trim()).filter(v => v);
    setVariantOptions(newOpts);
  };

  const removeOption = (index: number) => {
    setVariantOptions(variantOptions.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...generatedVariants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setGeneratedVariants(newVariants);
  };

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '2rem',
      background: 'white',
      padding: '2.5rem',
      borderRadius: '24px',
      border: '1px solid #eee',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      maxWidth: '900px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #eee',
      paddingBottom: '1rem',
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: 800,
      color: '#111',
      margin: 0,
    },
    tabs: {
      display: 'flex',
      gap: '1rem',
      borderBottom: '1px solid #eee',
      marginBottom: '1rem',
    },
    tab: (active: boolean) => ({
      padding: '12px 20px',
      border: 'none',
      background: 'none',
      borderBottom: active ? '2px solid #000' : '2px solid transparent',
      fontWeight: active ? 700 : 500,
      color: active ? '#000' : '#666',
      cursor: 'pointer',
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
    }),
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      marginBottom: '1.5rem',
    },
    label: {
      fontWeight: 600,
      fontSize: '0.9rem',
      color: '#333',
    },
    input: {
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid #e0e0e0',
      fontSize: '0.95rem',
      outline: 'none',
      transition: 'border-color 0.2s ease',
      backgroundColor: '#f9fafb',
    },
    textarea: {
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid #e0e0e0',
      fontSize: '0.95rem',
      outline: 'none',
      minHeight: '120px',
      resize: 'vertical' as const,
      backgroundColor: '#f9fafb',
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1.5rem',
    },
    button: {
      padding: '12px 24px',
      borderRadius: '10px',
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
    },
    primaryButton: {
      background: '#000',
      color: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    secondaryButton: {
      background: '#fff',
      color: '#333',
      border: '1px solid #ddd',
    },
    dangerButton: {
      background: '#fff0f0',
      color: '#ff4d4f',
      border: '1px solid #ffa39e',
    },
    mediaGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: '1rem',
      marginTop: '1rem',
    },
    mediaCard: {
      border: '1px solid #eee',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative' as const,
      background: '#f9fafb',
    },
    badge: {
      position: 'absolute' as const,
      top: '8px',
      left: '8px',
      background: '#000',
      color: '#fff',
      fontSize: '0.7rem',
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: 700,
    },
    variantTable: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginTop: '1rem',
      fontSize: '0.9rem',
    },
    th: {
      textAlign: 'left' as const,
      padding: '12px',
      borderBottom: '2px solid #eee',
      color: '#666',
      fontWeight: 600,
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #eee',
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{initialValues ? 'Edit Product' : 'Create Premium Product'}</h2>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>✕</button>
      </div>

      <nav style={styles.tabs}>
        <button type="button" style={styles.tab(activeTab === 'basic')} onClick={() => setActiveTab('basic')}>Basic Info</button>
        <button type="button" style={styles.tab(activeTab === 'media')} onClick={() => setActiveTab('media')}>Media</button>
        <button type="button" style={styles.tab(activeTab === 'pricing')} onClick={() => setActiveTab('pricing')}>Pricing & Inventory</button>
        <button type="button" style={styles.tab(activeTab === 'variants')} onClick={() => setActiveTab('variants')}>Variants</button>
      </nav>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div>
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Product Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required placeholder="e.g. Premium Wireless Headphones" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Slug</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} style={styles.input} placeholder="auto-generated-slug" />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={styles.input}>
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Short Description</label>
            <input type="text" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} style={styles.input} placeholder="Brief summary for listings" />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Full Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={styles.textarea} placeholder="Detailed product description storytelling..." />
          </div>
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              value={newImageUrl} 
              onChange={(e) => setNewImageUrl(e.target.value)} 
              style={{ ...styles.input, flex: 1 }} 
              placeholder="Paste Image URL here..." 
            />
            <button type="button" onClick={handleAddImage} style={{ ...styles.button, ...styles.primaryButton }}>Add Image</button>
          </div>

          <div style={styles.mediaGrid}>
            {images.map((img, index) => (
              <div key={index} style={styles.mediaCard}>
                {img.isPrimary && <div style={styles.badge}>Primary</div>}
                <img src={img.url} alt={img.altText || 'Product'} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                  <button type="button" onClick={() => handleSetPrimaryImage(index)} style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', background: '#eee', border: 'none', borderRadius: '4px' }}>Main</button>
                  <button type="button" onClick={() => handleRemoveImage(index)} style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', background: '#fff0f0', color: '#ff4d4f', border: 'none', borderRadius: '4px' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {images.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed #eee', borderRadius: '12px', color: '#999' }}>
              🖼️ No images added yet. Add a URL above.
            </div>
          )}
        </div>
      )}

      {/* Pricing & Inventory Tab */}
      {activeTab === 'pricing' && (
        <div>
          {hasVariants && (
            <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fef3c7', color: '#d97706', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              ⚠️ You have enabled variants. Pricing and stock are managed per variant in the <strong>Variants</strong> tab.
            </div>
          )}
          
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Price (₹) *</label>
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} style={styles.input} required={!hasVariants} disabled={hasVariants} min="0" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Compare at Price (₹)</label>
              <input type="number" value={comparePrice || ''} onChange={(e) => setComparePrice(e.target.value ? Number(e.target.value) : undefined)} style={styles.input} disabled={hasVariants} min="0" />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Cost per Item (₹)</label>
              <input type="number" value={costPrice || ''} onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : undefined)} style={styles.input} disabled={hasVariants} min="0" help-text="For profit calculation" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Inventory Quantity *</label>
              <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} style={styles.input} required={!hasVariants} disabled={hasVariants} min="0" />
            </div>
          </div>
        </div>
      )}

      {/* Variants Tab */}
      {activeTab === 'variants' && (
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '1.5rem' }}>
            <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} style={{ width: '18px', height: '18px' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>This product has multiple options, like different sizes or colors</span>
          </label>

          {hasVariants && (
            <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Options</h3>
              
              {variantOptions.map((opt, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 50px', gap: '10px', alignItems: 'center', marginBottom: '1rem' }}>
                  <input type="text" value={opt.name} onChange={(e) => updateOptionName(index, e.target.value)} style={styles.input} placeholder="e.g. Size" />
                  <input type="text" value={opt.values.join(', ')} onChange={(e) => updateOptionValues(index, e.target.value)} style={styles.input} placeholder="e.g. S, M, L (comma separated)" />
                  <button type="button" onClick={() => removeOption(index)} style={{ ...styles.button, ...styles.dangerButton, padding: '10px' }}>✕</button>
                </div>
              ))}

              <button type="button" onClick={addOption} style={{ ...styles.button, ...styles.secondaryButton, padding: '8px 16px', fontSize: '0.9rem' }}>+ Add another option</button>

              {generatedVariants.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Variant Inventory</h3>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>Set prices and stock for each combination.</p>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.variantTable}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Variant</th>
                          <th style={styles.th}>SKU</th>
                          <th style={styles.th}>Price (₹)</th>
                          <th style={styles.th}>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedVariants.map((v, index) => (
                          <tr key={index}>
                            <td style={styles.td}><strong>{v.name}</strong></td>
                            <td style={styles.td}><input type="text" value={v.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} style={{ ...styles.input, padding: '6px 10px' }} /></td>
                            <td style={styles.td}><input type="number" value={v.price} onChange={(e) => updateVariant(index, 'price', Number(e.target.value))} style={{ ...styles.input, padding: '6px 10px', width: '100px' }} /></td>
                            <td style={styles.td}><input type="number" value={v.stock} onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))} style={{ ...styles.input, padding: '6px 10px', width: '80px' }} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Wizard Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
        <div>
          <button type="button" onClick={onCancel} style={{ ...styles.button, ...styles.secondaryButton }}>Cancel</button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            onClick={handlePrevious} 
            style={{ ...styles.button, ...styles.secondaryButton, visibility: activeTab === 'basic' ? 'hidden' : 'visible' }}
          >
            ← Previous
          </button>
          
          {activeTab !== 'variants' ? (
            <button 
              type="button" 
              onClick={handleNext} 
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              Next →
            </button>
          ) : (
            <button 
              type="submit" 
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              Save Product
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
