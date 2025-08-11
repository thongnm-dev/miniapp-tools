import React, { useState, useMemo, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import {ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';

export interface DataTableColumn {
  key: string;
  label: string;
}

export interface DataTableProps {
  className?: string;
  columns: DataTableColumn[];
  data: Record<string, any>[];
  showPagination?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  onRowClick?: (row: Record<string, any>) => void;
  scrollHeight?: string | number; // e.g. '400px' or 400
  showFilter?: boolean;
  showCheckboxes?: boolean;
  selectedRows?: Set<string>;
  onRowSelectionChange?: (rowKey: string, selected: boolean) => void;
  rowKey?: string; // Key to identify rows for selection
  customCellRender?: { [key: string]: (row: Record<string, any>) => React.ReactNode };
  showRadio?: boolean;
  selectedRadio?: string;
  onRadioChange?: (rowKey: string) => void;
  onFilterChange?: (filter: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  className = '',
  columns,
  data,
  onRowClick,
  showPagination = false,
  pageSizeOptions = [5, 10, 20, 50],
  defaultPageSize = 100,
  scrollHeight = 400,
  showFilter = false,
  showCheckboxes = false,
  selectedRows = new Set(),
  onRowSelectionChange,
  rowKey = 'id',
  customCellRender,
  showRadio = false,
  selectedRadio,
  onRadioChange,
  onFilterChange,
}) => {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = data;
    if (filter.trim()) {
      filtered = filtered.filter(row =>
        columns.some(col =>
          String(row[col.key] ?? '')
            .toLowerCase()
            .includes(filter.toLowerCase())
        )
      );
    }
    if (sortKey) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];
        if (aValue === bValue) return 0;
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
    return filtered;
  }, [data, filter, sortKey, sortOrder, columns]);

  // No pagination: show all filteredData
  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * pageSize) % filteredData.length;
    setPage(newOffset);
  };

  // Reset page if filter or pageSize changes
  React.useEffect(() => {
    setPage(1);
  }, [filter, pageSize]);

  const btn = useCallback((type: string) => {
    const next = (type: string) => {
      return (
        <React.Fragment>
          <span>{type}</span>
          <ChevronDoubleRightIcon className='h-4 w-4'/>
        </React.Fragment>
      )
    }

    const prev = (type: string) => {
      return (
        <React.Fragment>
          <ChevronDoubleLeftIcon className='h-4 w-4'/>
          <span>{type}</span>
        </React.Fragment>
      )
    }
    return (
      <button className='border border-secondary-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed py-[8px] rounded-none w-16 text-center justify-center px-2 flex flex-row gap-2 items-center text-sm'>
        {type ==="next" && next(type)}
        {type ==="prev" && prev(type)}
        {(type !=="next" && type !=="prev") && <span>{type}</span> }
      </button>
    )
  }, [])

  return (
    <div className={`space-y-4 flex flex-col h-full ${className}`}>
      {/* Filter */}
      {showFilter && (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={e => {
            setFilter(e.target.value);
            onFilterChange?.(e.target.value);
          }}
          className="border border-secondary-300 rounded-lg px-3 py-2 focus:ring-gray-300 w-full md:w-64"
        />
        </div>
      )}
      {/* Table with scrollable body */}
      <div className="overflow-x-auto flex-1" style={{ maxHeight: typeof scrollHeight === 'number' ? `${scrollHeight}px` : scrollHeight }}>
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="sticky top-0 z-10">
            <tr>
              {showCheckboxes && !showRadio && (
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider w-12 bg-gray-200">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row[rowKey]))}
                    onChange={(e) => {
                      paginatedData.forEach(row => {
                        onRowSelectionChange?.(row[rowKey], e.target.checked);
                      });
                    }}
                    className="w-4 h-4 bg-white border-gray-300 rounded focus:ring-gray-300 focus:ring-2"
                  />
                </th>
              )}
              {showRadio && !showCheckboxes && (
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider w-15 bg-gray-200">
                  {/* Empty header for radio column */}
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-4 text-center text-xs font-medium uppercase tracking-wider cursor-pointer select-none bg-gray-200 ${customCellRender && customCellRender[col.key] ? ' w-12' : ''}`}
                  onClick={() => handleSort(col.key)}
                >
                  <span>{col.label}</span>
                  {sortKey === col.key && (
                    <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (showCheckboxes || showRadio ? 1 : 0)} className="text-center py-8 text-secondary-400">
                  Không có dữ liệu hiển thị.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {showCheckboxes && !showRadio && (
                    <td className="px-4 py-3 text-secondary-800 w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row[rowKey])}
                        onChange={(e) => {
                          e.stopPropagation();
                          onRowSelectionChange?.(row[rowKey], e.target.checked);
                        }}
                        className="w-4 h-4 bg-white border-gray-300 rounded focus:ring-gray-200 focus:ring-2"
                      />
                    </td>
                  )}
                  {showRadio && !showCheckboxes && (
                    <td className="px-4 py-3 text-secondary-800 w-12">
                      <input
                        type="radio"
                        name="datatable-radio"
                        checked={selectedRadio === row[rowKey]}
                        onChange={(e) => {
                          e.stopPropagation();
                          onRadioChange?.(row[rowKey]);
                        }}
                        className="w-4 h-4 p-2 bg-white border-gray-300 rounded-full focus:ring-gray-200 focus:ring-2"
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} className={`p-4 text-secondary-800${col.key === 'action' ? ' w-12' : ''}`}>
                      {customCellRender && customCellRender[col.key]
                        ? customCellRender[col.key](row)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <ReactPaginate
          className='flex flex-row'
          pageLabelBuilder={(page) => btn(page.toString())}
          breakLabel={btn("...")}
          nextLabel={btn("next")}
          previousLabel={btn("prev")}
          onPageChange={handlePageClick}
          pageRangeDisplayed={3}
          pageCount={totalPages}
          renderOnZeroPageCount={null}
        />
      )}
    </div>
  );
};

export default DataTable; 