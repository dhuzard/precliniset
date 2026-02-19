
import { DataTableListResponse, DataTableFilterParams } from '../types';

export const fetchDataTables = async (params: DataTableFilterParams, csrfToken?: string): Promise<DataTableListResponse> => {
    const searchParams = new URLSearchParams();

    // Flatten the complex object for jQuery DataTables compatibility if the backend expects standardized params
    // Or send as JSON if we update the backend.
    // The current backend (Flask-RestX or raw Flask) likely expects standard DataTables query parameters.
    // Let's mimic what jquery.dataTables sends.

    searchParams.append('draw', params.draw.toString());
    searchParams.append('start', params.start.toString());
    searchParams.append('length', params.length.toString());

    if (params.search?.value) searchParams.append('search[value]', params.search.value);

    // Custom filters
    if (params.group_id) searchParams.append('group_id', params.group_id);
    // ... other filters

    // Note: Implementing full DataTables parameter serialization manually is tedious.
    // For now, let's fetch with GET and minimal params to test connection.

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
