import { createTableConfig } from '../../../../mtse-shared/src/tables';
import { createFormConfig } from '../../../../mtse-shared/src/forms';
import type { FieldType } from '../../../../mtse-shared/src/forms';

export interface StoreFormValues {
  tenantId: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  currency: string;
  showWishlist: boolean;
}

// ---------------------------------------------------------------------------
// Table Configuration (Stores List)
// ---------------------------------------------------------------------------

export const storeTableConfig = createTableConfig<StoreFormValues>(
  [
    {
      key: 'logoUrl',
      label: 'Logo',
      width: '60px',
      render: (val) => val ? (
        <img src={String(val)} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '32px', height: '32px', background: '#eee', borderRadius: '4px' }} />
      )
    },
    {
      key: 'name',
      label: 'Store Name',
      sortable: true
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (val) => (
        <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>
          {String(val)}
        </code>
      )
    }
  ],
  'tenantId',
  {
    searchable: true,
    searchFields: ['tenantId', 'name', 'slug'],
    pageSize: 5,
    emptyMessage: 'No stores have been provisioned yet.'
  }
);

// ---------------------------------------------------------------------------
// Form Configuration (Add/Edit Store)
// ---------------------------------------------------------------------------

export const storeFormConfig = createFormConfig([
  {
    name: 'name',
    type: 'text',
    label: 'Store Brand Name',
    placeholder: 'e.g., Luxe Fashion',
    required: true,
    colSpan: 1
  },
  {
    name: 'slug',
    type: 'text',
    label: 'Store URL Slug',
    placeholder: 'e.g., luxe-fashion',
    required: true,
    colSpan: 1
  },
  {
    name: 'description',
    type: 'text',
    label: 'Brand Description',
    placeholder: 'Tell customers about your brand...',
    colSpan: 2
  },
  {
    name: 'logoUrl',
    type: 'text',
    label: 'Logo URL',
    placeholder: 'https://...',
    colSpan: 1
  },
  {
    name: 'bannerUrl',
    type: 'text',
    label: 'Banner URL',
    placeholder: 'https://...',
    colSpan: 1
  },
  {
    name: 'currency',
    type: 'text',
    label: 'Currency Code',
    placeholder: 'INR, USD, etc.',
    defaultValue: 'INR',
    colSpan: 1
  },
  {
    name: 'showWishlist',
    type: 'checkbox',
    placeholder: 'Enable Wishlist Feature',
    defaultValue: true,
    colSpan: 1
  }
], {
  columns: 2,
  submitLabel: 'Save Store Settings',
  resetLabel: 'Cancel Changes'
});
