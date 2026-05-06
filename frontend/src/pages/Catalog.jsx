import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MetadataTable from '../components/Table'
import ChatPanel from '../components/ChatPanel'
import ColumnCard from '../components/ColumnCard'

export default function Catalog() {
  const location = useLocation()
  const navigate = useNavigate()
  const [metadata, setMetadata] = useState(location.state?.metadata || [])
  const [schemaName, setSchemaName] = useState(location.state?.schemaName || '')
  const [filterType, setFilterType] = useState('All')
  const [filterSensitivity, setFilterSensitivity] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('table')

  // If state was passed from navigation, use it
  useEffect(() => {
    if (location.state?.metadata) {
      setMetadata(location.state.metadata)
      setSchemaName(location.state.schemaName || '')
    }
  }, [location.state])

  const exportAsCSV = () => {
    if (!metadata || metadata.length === 0) return

    const headers = ['Column Name', 'Description', 'Inferred Type', 'Data Type Tag', 'Sensitivity Tag', 'Sensitivity Level']
    const rows = metadata.map((col) => [
      col.column_name,
      `"${(col.description || '').replace(/"/g, '""')}"`,
      col.inferred_type,
      col.data_type_tag,
      col.sensitivity_tag,
      col.sensitivity_level,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${schemaName || 'metadata'}_catalog.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Stats
  const stats = metadata.length > 0 ? {
    total: metadata.length,
    high: metadata.filter((c) => c.sensitivity_level === 'High').length,
    medium: metadata.filter((c) => c.sensitivity_level === 'Medium').length,
    low: metadata.filter((c) => c.sensitivity_level === 'Low').length,
    pii: metadata.filter((c) => c.sensitivity_tag === 'PII').length,
  } : null

  if (!metadata || metadata.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="w-20 h-20 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-surface-700 mb-2">No Metadata Available</h2>
        <p className="text-surface-400 mb-6">Upload a schema first to generate your metadata catalog.</p>
        <button
          id="btn-go-upload"
          onClick={() => navigate('/upload')}
          className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all duration-200 shadow-md shadow-primary-500/25 text-sm"
        >
          Go to Upload
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-800">
              {schemaName || 'Metadata Catalog'}
            </h1>
            <p className="text-sm text-surface-400 mt-0.5">
              {metadata.length} column{metadata.length !== 1 ? 's' : ''} analyzed
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-surface-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'table' ? 'bg-white text-surface-800 shadow-sm' : 'text-surface-500'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'cards' ? 'bg-white text-surface-800 shadow-sm' : 'text-surface-500'
                }`}
              >
                Cards
              </button>
            </div>
            <button
              id="btn-export"
              onClick={exportAsCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-surface-200 text-surface-700 text-sm font-medium rounded-xl hover:bg-surface-50 hover:border-primary-300 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-surface-200 p-3.5">
              <p className="text-xs text-surface-400 font-medium">Total Columns</p>
              <p className="text-xl font-bold text-surface-800 mt-0.5">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl border border-red-200 p-3.5">
              <p className="text-xs text-red-500 font-medium">🔴 High Risk</p>
              <p className="text-xl font-bold text-red-700 mt-0.5">{stats.high}</p>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 p-3.5">
              <p className="text-xs text-amber-500 font-medium">🟡 Medium</p>
              <p className="text-xl font-bold text-amber-700 mt-0.5">{stats.medium}</p>
            </div>
            <div className="bg-white rounded-xl border border-emerald-200 p-3.5">
              <p className="text-xs text-emerald-500 font-medium">🟢 Low Risk</p>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.low}</p>
            </div>
            <div className="bg-white rounded-xl border border-surface-200 p-3.5 col-span-2 sm:col-span-1">
              <p className="text-xs text-surface-400 font-medium">PII Columns</p>
              <p className="text-xl font-bold text-surface-800 mt-0.5">{stats.pii}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 relative">
            <svg className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search-columns"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search columns..."
              className="w-full rounded-xl border border-surface-200 pl-10 pr-4 py-2.5 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
            />
          </div>
          <select
            id="filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-surface-200 px-4 py-2.5 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
          >
            <option value="All">All Data Types</option>
            <option value="Numeric">Numeric</option>
            <option value="Categorical">Categorical</option>
            <option value="DateTime">DateTime</option>
            <option value="Boolean">Boolean</option>
            <option value="Text">Text</option>
            <option value="ID">ID</option>
          </select>
          <select
            id="filter-sensitivity"
            value={filterSensitivity}
            onChange={(e) => setFilterSensitivity(e.target.value)}
            className="rounded-xl border border-surface-200 px-4 py-2.5 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
          >
            <option value="All">All Sensitivity Tags</option>
            <option value="PII">PII</option>
            <option value="Financial">Financial</option>
            <option value="Health">Health</option>
            <option value="Internal">Internal</option>
            <option value="Public">Public</option>
          </select>
        </div>

        {/* Table or Cards View */}
        {viewMode === 'table' ? (
          <MetadataTable
            metadata={metadata}
            filterType={filterType}
            filterSensitivity={filterSensitivity}
            searchQuery={searchQuery}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metadata
              .filter((col) => {
                let pass = true
                if (searchQuery) {
                  const q = searchQuery.toLowerCase()
                  pass = pass && (col.column_name.toLowerCase().includes(q) || col.description?.toLowerCase().includes(q))
                }
                if (filterType !== 'All') pass = pass && col.data_type_tag === filterType
                if (filterSensitivity !== 'All') pass = pass && col.sensitivity_tag === filterSensitivity
                return pass
              })
              .map((col, idx) => (
                <ColumnCard key={col.column_name + idx} column={col} />
              ))}
          </div>
        )}

        {/* Chat Panel */}
        <div className="mt-8">
          <ChatPanel metadata={metadata} />
        </div>
      </div>
    </div>
  )
}
