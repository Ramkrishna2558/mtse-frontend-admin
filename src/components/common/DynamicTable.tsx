import { useState } from 'react';
import type { TableConfig, ColumnConfig } from '../../../../mtse-shared/src/tables';
import { formatCellValue } from '../../../../mtse-shared/src/tables';

interface DynamicTableProps<T extends Record<string, any>> {
  config: TableConfig<T>;
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
}

export function DynamicTable<T extends Record<string, any>>({ 
  config, 
  data, 
  onRowClick,
  isLoading = false 
}: DynamicTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = config.searchable && config.searchFields && searchTerm
    ? data.filter(row => 
        config.searchFields!.some((field: keyof T) => 
          String(row[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // 2. Paginate data if enabled
  const pageSize = config.pageSize || 10;
  const paginatedData = config.pagination
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData;

  const totalPages = Math.ceil(filteredData.length / pageSize);

  return (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* Table Header Controls (Search) */}
      {config.searchable && (
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '250px' }}
          />
        </div>
      )}

      {/* The Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#fafafa', borderBottom: '2px solid #eee' }}>
            <tr>
              {config.columns.filter((col: ColumnConfig<T>) => !col.hidden).map((col: ColumnConfig<T>) => (
                <th 
                  key={col.key as string}
                  style={{ 
                    padding: '16px', 
                    fontWeight: 600, 
                    color: '#666',
                    textAlign: col.align || 'left',
                    width: col.width,
                    minWidth: col.minWidth
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={config.columns.length} style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length} style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
                  {config.emptyMessage || 'No data found'}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr 
                  key={String(row[config.rowKey])}
                  onClick={() => onRowClick?.(row)}
                  style={{ borderBottom: '1px solid #f0f0f0', cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => { if (onRowClick) e.currentTarget.style.background = '#f9f9f9'; }}
                  onMouseLeave={(e) => { if (onRowClick) e.currentTarget.style.background = 'white'; }}
                >
                  {config.columns.filter((col: ColumnConfig<T>) => !col.hidden).map((col: ColumnConfig<T>) => (
                    <td 
                      key={col.key as string}
                      style={{ padding: '16px', textAlign: col.align || 'left', color: '#333' }}
                    >
                      {col.render 
                        ? col.render(row[col.key], row) 
                        : formatCellValue(row[col.key], col as any)
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Controls (Pagination) */}
      {config.pagination && totalPages > 1 && (
        <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === 1 ? '#eee' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}>
              {currentPage} / {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === totalPages ? '#eee' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
