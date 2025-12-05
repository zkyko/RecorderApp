import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  sortable?: boolean;
  onSort?: (column: string, direction: SortDirection) => void;
  onRowClick?: (row: T) => void;
  selectedRows?: Set<string | number>;
  onRowSelect?: (rowId: string | number, selected: boolean) => void;
  getRowId?: (row: T) => string | number;
  className?: string;
  showZebraStriping?: boolean;
  showHover?: boolean;
  stickyFirstColumn?: boolean;
}

/**
 * Reusable Table component with sorting, zebra striping, column visibility, and hover states
 * Based on UI-update.md specifications
 */
function Table<T extends Record<string, any>>({
  columns,
  data,
  sortable = true,
  onSort,
  onRowClick,
  selectedRows,
  onRowSelect,
  getRowId,
  className = '',
  showZebraStriping = true,
  showHover = true,
  stickyFirstColumn = false,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map((col) => col.key))
  );

  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column || !column.sortable) return;

    let newDirection: SortDirection = 'asc';
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      }
    }

    setSortColumn(newDirection ? columnKey : null);
    setSortDirection(newDirection);

    if (onSort) {
      onSort(columnKey, newDirection);
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const visibleColumnsList = columns.filter((col) => visibleColumns.has(col.key));

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronDown size={14} className="opacity-30" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp size={14} />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown size={14} />;
    }
    return <ChevronDown size={14} className="opacity-30" />;
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table w-full">
        <thead>
          <tr>
            {onRowSelect && (
              <th className="w-12">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={
                    selectedRows && data.length > 0
                      ? data.every((row) => {
                          const id = getRowId ? getRowId(row) : row.id;
                          return selectedRows.has(id);
                        })
                      : false
                  }
                  onChange={(e) => {
                    if (onRowSelect && getRowId) {
                      data.forEach((row) => {
                        const id = getRowId(row);
                        onRowSelect(id, e.target.checked);
                      });
                    }
                  }}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {visibleColumnsList.map((column) => (
              <th
                key={column.key}
                className={`
                  ${column.sortable ? 'cursor-pointer select-none' : ''}
                  ${stickyFirstColumn && column === visibleColumnsList[0] ? 'sticky left-0 bg-base-200 z-10' : ''}
                `.trim()}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className={`flex items-center gap-2 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
                  <span>{column.label}</span>
                  {column.sortable && sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={visibleColumnsList.length + (onRowSelect ? 1 : 0)} className="text-center py-8 text-base-content/60">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowId = getRowId ? getRowId(row) : row.id;
              const isSelected = selectedRows?.has(rowId);
              const isEven = showZebraStriping && rowIndex % 2 === 0;

              return (
                <tr
                  key={rowId}
                  className={`
                    ${showHover ? 'hover:bg-base-300' : ''}
                    ${isEven ? 'bg-base-200/50' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `.trim()}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {onRowSelect && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={isSelected || false}
                        onChange={(e) => {
                          if (onRowSelect) {
                            onRowSelect(rowId, e.target.checked);
                          }
                        }}
                        aria-label={`Select row ${rowId}`}
                      />
                    </td>
                  )}
                  {visibleColumnsList.map((column) => (
                    <td
                      key={column.key}
                      className={`
                        ${stickyFirstColumn && column === visibleColumnsList[0] ? 'sticky left-0 bg-base-200 z-10' : ''}
                      `.trim()}
                      style={{ textAlign: column.align }}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
