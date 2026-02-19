
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DataTableList from './components/DataTableList'
import './index.css'

const queryClient = new QueryClient()

const rootElement = document.getElementById('react-root')
if (rootElement) {
    const dataset = rootElement.dataset
    const protocols = dataset.protocols ? JSON.parse(dataset.protocols) : []
    const urls = dataset.urls ? JSON.parse(dataset.urls) : undefined

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <DataTableList
                    initialGroupId={dataset.groupId}
                    csrfToken={dataset.csrfToken}
                    protocols={protocols}
                    urls={urls}
                />
            </QueryClientProvider>
        </React.StrictMode>,
    )
} else {
    // Dev mode fallback
    const appRoot = document.getElementById('root')
    if (appRoot) {
        ReactDOM.createRoot(appRoot).render(
            <React.StrictMode>
                <QueryClientProvider client={queryClient}>
                    <div className="p-4">
                        <h1>Dev Mode - React App</h1>
                        <DataTableList />
                    </div>
                </QueryClientProvider>
            </React.StrictMode>
        )
    }
}
