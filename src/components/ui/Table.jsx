import React from 'react';
import { SkeletonTable } from './Skeleton';
import EmptyState from './EmptyState';

/**
 * Standardized Responsive Table component.
 * On desktop (>=768px): renders a high-fidelity data table with sticky-ready headers.
 * On mobile (<768px): automatically renders a stacked card layout using mobileCardRenderer if provided.
 */
export default function Table({
  columns = [], // [{ header: 'Name', accessor: 'name', className?: '' }, ...]
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyIcon = 'inbox',
  emptyTitle = 'No Records Found',
  emptyDescription = 'There are no records matching your current filter criteria.',
  mobileCardRenderer,
  className = '',
}) {
  if (isLoading) {
    return <SkeletonTable rows={5} cols={columns.length || 4} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile Card Layout (visible on < md: 768px if mobileCardRenderer is provided) */}
      {mobileCardRenderer && (
        <div className="md:hidden space-y-3">
          {data.map((item, index) => (
            <div
              key={item[keyField] || index}
              className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container/60 shadow-xs space-y-3"
            >
              {mobileCardRenderer(item, index)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop Table View (hidden on mobile if mobileCardRenderer exists, otherwise horizontally scrollable with styled scrollbar) */}
      <div
        className={`${
          mobileCardRenderer ? 'hidden md:block' : 'w-full overflow-x-auto'
        } rounded-2xl bg-surface-container-lowest border border-surface-container/60 shadow-xs overflow-hidden`}
      >
        <table className="w-full text-left border-collapse font-body-md text-sm">
          <thead>
            <tr className="bg-surface-container/50 border-b border-surface-container text-on-surface-variant font-label-md text-xs uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3.5 px-4 font-semibold ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container/40 text-on-surface">
            {data.map((row, rIdx) => (
              <tr
                key={row[keyField] || rIdx}
                className="hover:bg-surface-container-low/60 transition-colors"
              >
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={`py-3.5 px-4 ${col.className || ''}`}>
                    {col.cell ? col.cell(row, rIdx) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
