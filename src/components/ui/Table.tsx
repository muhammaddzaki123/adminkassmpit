import React from 'react';

interface Column<T> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: (item: T) => React.ReactNode;
  isLoading?: boolean;
}

export function Table<T extends { id?: string | number }>({ columns, data, actions, isLoading }: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full p-8 text-center text-[#6b7280]">
        Loading data...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="w-full p-8 text-center text-[#6b7280]">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto -webkit-overflow-scrolling-touch">
      <table className="w-full text-left text-sm min-w-[480px]">
        <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 sm:px-6 py-3 sm:py-4 font-medium text-[#4b5563] text-xs sm:text-sm ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-[#4b5563] text-right text-xs sm:text-sm">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {data.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-[#f9fafb] transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={`px-3 sm:px-6 py-2.5 sm:py-4 text-[#1c1c1c] text-xs sm:text-sm ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
              {actions && (
                <td className="px-3 sm:px-6 py-2.5 sm:py-4 text-right">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
