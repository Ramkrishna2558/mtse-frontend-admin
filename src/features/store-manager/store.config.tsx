import { createTableConfig } from '../../../../mtse-shared/src/tables';
import { createFormConfig } from '../../../../mtse-shared/src/forms';
import type { FieldType } from '../../../../mtse-shared/src/forms';

export interface StoreFormValues {
  tenantId: string;
  brandName: string;
  brandTagline: string;
  showWishlist: boolean;
}

// ---------------------------------------------------------------------------
// Table Configuration (Stores List)
// ---------------------------------------------------------------------------

export const storeTableConfig = createTableConfig<StoreFormValues>(
  [
    {
      key: 'tenantId',
      label: 'Tenant ID',
      width: '150px',
      render: (val) => (
        <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>
          {String(val)}
        </code>
      )
    },
    {
      key: 'brandName',
      label: 'Brand Name',
      sortable: true
    }
  ],
  'tenantId',
  {
    searchable: true,
    searchFields: ['tenantId', 'brandName'],
    pageSize: 5,
    emptyMessage: 'No stores have been provisioned yet.'
  }
);

// ---------------------------------------------------------------------------
// Form Configuration (Add/Edit Store)
// ---------------------------------------------------------------------------

export const storeFormConfig = createFormConfig([
  {
    name: 'tenantId',
    type: 'text',
    label: 'Unique Tenant ID',
    placeholder: 'e.g., fashion_store_1',
    required: true,
    helpText: 'A unique identifier for this database tenant.',
    colSpan: 2
  },
  {
    name: 'brandName',
    type: 'text',
    label: 'Store Brand Name',
    placeholder: 'e.g., Luxe Fashion',
    required: true,
    colSpan: 1
  },
  {
    name: 'brandTagline',
    type: 'text',
    label: 'Brand Tagline',
    placeholder: 'e.g., Elegance in every stitch',
    colSpan: 1
  },
  {
    name: 'showWishlist',
    type: 'checkbox',
    placeholder: 'Enable Wishlist Feature',
    defaultValue: true,
    colSpan: 2
  }
], {
  columns: 2,
  submitLabel: 'Provision Storefront',
  resetLabel: 'Cancel Provisioning'
});
