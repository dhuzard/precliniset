
import React, { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchDataTables } from '../api/datatables';
import { DataTable } from '../types';
import { IndeterminateCheckbox } from './IndeterminateCheckbox';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    SortingState,
    RowSelectionState,
} from '@tanstack/react-table';

interface Props {
    initialGroupId?: string;
    csrfToken?: string;
    protocols?: Array<{ id: number; name: string }>;
    urls?: {
        analyze: string;
        download: string;
        delete: string;
    };
}

const columnHelper = createColumnHelper<DataTable>();

const DataTableList: React.FC<Props> = ({ initialGroupId, csrfToken, protocols = [], urls }) => {
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Custom Filters
    const [selectedProtocol, setSelectedProtocol] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    // Column definitions
    const columns = useMemo(() => [
        {
            id: 'select',
            header: ({ table }: any) => (
                <IndeterminateCheckbox
                    {...{
                        checked: table.getIsAllRowsSelected(),
                        indeterminate: table.getIsSomeRowsSelected(),
                        onChange: table.getToggleAllRowsSelectedHandler(),
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
            ),
            cell: ({ row }: any) => (
                <IndeterminateCheckbox
                    {...{
                        checked: row.getIsSelected(),
                        disabled: !row.getCanSelect(),
                        indeterminate: row.getIsSomeSelected(),
                        onChange: row.getToggleSelectedHandler(),
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
            ),
        },
        columnHelper.accessor('id', {
            header: 'ID',
            cell: info => info.getValue(),
            enableSorting: false,
        }),
        columnHelper.accessor('date', {
            header: 'Date',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('protocol_name', {
            header: 'Protocol',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('group_name', {
            header: 'Group',
            cell: info => info.getValue(),
        }),
        columnHelper.accessor('project_name', {
            header: 'Project',
            cell: info => info.getValue(),
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: info => <div dangerouslySetInnerHTML={{ __html: info.row.original.actions }} />,
            enableSorting: false,
        })
    ], []);

    const getColumnIndexForId = (id: string) => {
        const map = ['select', 'id', 'date', 'protocol_name', 'group_name', 'project_name', 'actions'];
        return map.indexOf(id);
    };

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ['datatables', pagination, sorting, initialGroupId, selectedProtocol, dateFrom, dateTo],
        queryFn: () => {
            const orderParams = sorting.map(s => ({
                column: getColumnIndexForId(s.id),
                dir: s.desc ? 'desc' as const : 'asc' as const
            }));

            const columnsMetadata = [
                { data: '', name: '', searchable: false, orderable: false, search: { value: '', regex: false } },
                { data: 'id', name: 'id', searchable: false, orderable: false, search: { value: '', regex: false } },
                { data: 'date', name: 'date', searchable: true, orderable: true, search: { value: '', regex: false } },
                { data: 'protocol_name', name: 'protocol.name', searchable: true, orderable: true, search: { value: '', regex: false } },
                { data: 'group_name', name: 'group.name', searchable: true, orderable: true, search: { value: '', regex: false } },
                { data: 'project_name', name: 'project.name', searchable: true, orderable: true, search: { value: '', regex: false } },
                { data: 'actions', name: '', searchable: false, orderable: false, search: { value: '', regex: false } },
            ];

            return fetchDataTables({
                draw: Date.now(),
                start: pagination.pageIndex * pagination.pageSize,
                length: pagination.pageSize,
                group_id: initialGroupId,
                order: orderParams,
                columns: columnsMetadata,
                protocol_id: selectedProtocol || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined
            }, csrfToken);
        },
        placeholderData: keepPreviousData // Keep data while fetching new page
    });

    const table = useReactTable({
        data: data?.data || [],
        columns,
        pageCount: data?.recordsTotal ? Math.ceil(data.recordsTotal / pagination.pageSize) : -1,
        state: {
            pagination,
            sorting,
            rowSelection,
        },
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        getRowId: row => row.id.toString(),
    });

    const selectedCount = Object.keys(rowSelection).length;

    const handleBatchAction = async (actionUrl: string | undefined) => {
        if (!actionUrl || !selectedCount) return;
        if (!confirm(`Are you sure you want to perform this action on ${selectedCount} items?`)) return;

        setIsSubmitting(true);
        setActionError(null);

        try {
            // Construct hidden form for submission
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = actionUrl;

            const csrf = document.createElement('input');
            csrf.type = 'hidden';
            csrf.name = 'csrf_token';
            csrf.value = csrfToken || '';
            form.appendChild(csrf);

            Object.keys(rowSelection).forEach(id => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'selected_datatable_ids[]';
                input.value = id;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
            // isSubmitting stays true until page reload
        } catch (e) {
            console.error(e);
            setActionError('Failed to submit action.');
            setIsSubmitting(false);
        }
    };

    const handleBatchDelete = async () => {
        if (!urls?.delete || !selectedCount) return;
        if (!confirm(`Are you sure you want to PERMANENTLY delete ${selectedCount} items? This cannot be undone.`)) return;

        setIsSubmitting(true);
        setActionError(null);

        try {
            const response = await fetch(urls.delete, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken || ''
                },
                body: JSON.stringify({ datatable_ids: Object.keys(rowSelection) })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const result = await response.json();

            if (result.success) {
                setRowSelection({});
                refetch();
                // Optional: Show success toast
            } else {
                setActionError(result.message || 'Error deleting items');
            }
        } catch (e) {
            console.error(e);
            setActionError('An error occurred while deleting items.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow-sm relative">
            {/* Loading Overlay for Actions */}
            {isSubmitting && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                        <span className="text-gray-700 font-medium">Processing...</span>
                    </div>
                </div>
            )}

            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">DataTables</h2>

                <div className="flex items-center gap-2">
                    {selectedCount > 0 && (
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 animate-in fade-in zoom-in duration-200">
                            <span className="font-semibold text-sm text-indigo-700 mr-2">{selectedCount} selected</span>

                            <div className="h-4 w-px bg-indigo-200 mx-1"></div>

                            <button
                                onClick={() => handleBatchAction(urls?.analyze)}
                                disabled={isSubmitting}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 transition-colors shadow-sm"
                                title="Analyze Selected"
                            >
                                Analyze
                            </button>
                            <button
                                onClick={() => handleBatchAction(urls?.download)}
                                disabled={isSubmitting}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 transition-colors shadow-sm"
                                title="Download Merged"
                            >
                                Download
                            </button>
                            <button
                                onClick={handleBatchDelete}
                                disabled={isSubmitting}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 transition-colors shadow-sm"
                                title="Delete Selected"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Error Alert */}
            {actionError && (
                <div className="bg-red-50 text-red-700 p-3 rounded mb-4 border border-red-200 flex justify-between items-center">
                    <span>{actionError}</span>
                    <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                </div>
            )}

            {/* Filters Panel */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Protocol</label>
                        <select
                            className="form-select block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={selectedProtocol}
                            onChange={(e) => { setSelectedProtocol(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })); }}
                        >
                            <option value="">All Protocols</option>
                            {protocols.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date From</label>
                        <input
                            type="date"
                            className="form-input block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })); }}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date To</label>
                        <input
                            type="date"
                            className="form-input block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })); }}
                        />
                    </div>
                    <div className="flex items-end">
                        {(selectedProtocol || dateFrom || dateTo) && (
                            <button
                                className="text-sm text-gray-500 hover:text-indigo-600 font-medium mb-2 transition-colors"
                                onClick={() => {
                                    setSelectedProtocol('');
                                    setDateFrom('');
                                    setDateTo('');
                                    setPagination(p => ({ ...p, pageIndex: 0 }));
                                }}
                            >
                                ✕ Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Table Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div className="animate-spin h-10 w-10 border-4 border-gray-200 border-t-indigo-500 rounded-full mb-3"></div>
                    <p>Loading records...</p>
                </div>
            ) : isError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded border border-red-200">
                    <h3 className="font-bold">Error loading data</h3>
                    <p>{(error as Error).message}</p>
                    <button onClick={() => refetch()} className="mt-2 text-sm underline hover:text-red-800">Try Again</button>
                </div>
            ) : (
                <div className="overflow-x-auto border rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none group focus:outline-none"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-1">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                <span className="text-gray-400 group-hover:text-gray-600">
                                                    {{
                                                        asc: ' ↑',
                                                        desc: ' ↓',
                                                    }[header.column.getIsSorted() as string] ?? ''}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 relative">
                            {/* Data Rows */}
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className={`${row.getIsSelected() ? 'bg-indigo-50' : 'hover:bg-gray-50'} transition-colors`}>
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100 last:border-0">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p>No records found matching your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {/* Loading overlay for pagination/sorting updates */}
                            {isFetching && !isLoading && (
                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                    <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                                </div>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                        Page <span className="font-medium text-gray-900">{table.getState().pagination.pageIndex + 1}</span> of <span className="font-medium text-gray-900">{table.getPageCount() || 1}</span>
                    </span>
                    <select
                        value={table.getState().pagination.pageSize}
                        onChange={e => {
                            table.setPageSize(Number(e.target.value))
                        }}
                        className="form-select border-gray-300 rounded-md text-sm py-1 pl-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {[10, 20, 30, 40, 50].map(pageSize => (
                            <option key={pageSize} value={pageSize}>
                                Show {pageSize}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </button>
                    <button
                        className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataTableList;
