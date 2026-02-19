
export interface DataTable {
    id: number;
    date: string;
    protocol_name: string;
    group_name: string;
    project_name: string;
    is_archived: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_view?: boolean;
    action_urls?: {
        view?: string;
        edit?: string;
        analyze?: string;
        download?: string;
        delete?: string;
    };
}

export interface DataTableListResponse {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: DataTable[];
    error?: string;
}

export interface DataTableFilterParams {
    draw: number;
    start: number;
    length: number;
    project_id?: string;
    group_id?: string;
    is_archived?: string;
    protocol_id?: string;
    date_from?: string;
    date_to?: string;
    search?: {
        value: string;
        regex: boolean;
    };
    order?: {
        column: number;
        dir: 'asc' | 'desc';
    }[];
    columns?: {
        data: string;
        name: string;
        searchable: boolean;
        orderable: boolean;
        search: {
            value: string;
            regex: boolean;
        }
    }[];
}
