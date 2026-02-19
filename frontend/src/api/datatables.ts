
import { DataTableListResponse, DataTableFilterParams } from '../types';

const serializeDataTableParams = (params: DataTableFilterParams): URLSearchParams => {
    const searchParams = new URLSearchParams();

    searchParams.append('draw', params.draw.toString());
    searchParams.append('start', params.start.toString());
    searchParams.append('length', params.length.toString());

    if (params.search) {
        searchParams.append('search[value]', params.search.value || '');
        searchParams.append('search[regex]', String(params.search.regex));
    }

    // Custom filters
    if (params.group_id) searchParams.append('group_id', params.group_id);
    if (params.project_id) searchParams.append('project_id', params.project_id);
    if (params.is_archived) searchParams.append('is_archived', params.is_archived);
    if (params.protocol_id) searchParams.append('protocol_id', params.protocol_id);
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);

    // DataTables ordering
    if (params.order?.length) {
        params.order.forEach((orderItem, index) => {
            searchParams.append(`order[${index}][column]`, orderItem.column.toString());
            searchParams.append(`order[${index}][dir]`, orderItem.dir);
        });
    }

    // DataTables columns metadata
    if (params.columns?.length) {
        params.columns.forEach((column, index) => {
            searchParams.append(`columns[${index}][data]`, column.data);
            searchParams.append(`columns[${index}][name]`, column.name);
            searchParams.append(`columns[${index}][searchable]`, String(column.searchable));
            searchParams.append(`columns[${index}][orderable]`, String(column.orderable));
            searchParams.append(`columns[${index}][search][value]`, column.search.value || '');
            searchParams.append(`columns[${index}][search][regex]`, String(column.search.regex));
        });
    }

    return searchParams;
};

export const fetchDataTables = async (params: DataTableFilterParams, csrfToken?: string): Promise<DataTableListResponse> => {
    const searchParams = serializeDataTableParams(params);

    const response = await fetch(`/api/v1/server_side/datatables/server_side_data_table_list?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-CSRFToken': csrfToken || ''
        }
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
};
