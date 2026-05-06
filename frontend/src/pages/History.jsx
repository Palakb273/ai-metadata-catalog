import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchHistory } from '../lib/api'
import Spinner from '../components/Spinner'

export default function History() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchHistory()
      setEntries(data.entries || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEntryClick = (entry) => {
    navigate('/catalog', {
      state: {
        metadata: entry.metadata,
        schemaName: entry.schema_name,
        rawSchema: entry.raw_schema,
      },
    })
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getColumnCount = (entry) => {
    return entry.metadata?.length || entry.raw_schema?.length || 0
  }

  const getSensitivityBreakdown = (entry) => {
    if (!entry.metadata) return null
    const high = entry.metadata.filter((c) => c.sensitivity_level === 'High').length
    const medium = entry.metadata.filter((c) => c.sensitivity_level === 'Medium').length
    const low = entry.metadata.filter((c) => c.sensitivity_level === 'Low').length
    return { high, medium, low }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <Spinner message="Loading your analysis history..." />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-surface-800">Analysis History</h1>
            <p className="text-sm text-surface-400 mt-1">
              {entries.length} schema{entries.length !== 1 ? 's' : ''} analyzed
            </p>
          </div>
          <button
            id="btn-new-upload"
            onClick={() => navigate('/upload')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-md shadow-primary-500/25"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Analysis
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-danger-100/60 border border-red-200 rounded-xl text-sm text-danger-500 animate-fade-in" id="history-error">
            <p>{error}</p>
            <button
              onClick={loadHistory}
              className="mt-2 text-primary-500 hover:text-primary-600 font-medium text-xs"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {entries.length === 0 && !error && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-surface-700 mb-2">No History Yet</h2>
            <p className="text-surface-400 mb-6">Your analyzed schemas will appear here.</p>
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all shadow-md shadow-primary-500/25 text-sm"
            >
              Upload Your First Schema
            </button>
          </div>
        )}

        {/* Entries Grid */}
        <div className="space-y-3">
          {entries.map((entry) => {
            const breakdown = getSensitivityBreakdown(entry)
            return (
              <button
                key={entry.id}
                onClick={() => handleEntryClick(entry)}
                className="w-full text-left bg-white rounded-xl border border-surface-200 p-5 hover:shadow-md hover:border-primary-200 transition-all duration-200 group"
                id={`history-entry-${entry.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
                        <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-surface-800 group-hover:text-primary-600 transition-colors truncate">
                        {entry.schema_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 ml-10">
                      <p className="text-xs text-surface-400">
                        {formatDate(entry.created_at)}
                      </p>
                      <p className="text-xs text-surface-400">
                        {getColumnCount(entry)} columns
                      </p>
                    </div>
                  </div>

                  {/* Sensitivity Breakdown */}
                  {breakdown && (
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {breakdown.high > 0 && (
                        <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                          {breakdown.high} High
                        </span>
                      )}
                      {breakdown.medium > 0 && (
                        <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                          {breakdown.medium} Med
                        </span>
                      )}
                      {breakdown.low > 0 && (
                        <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                          {breakdown.low} Low
                        </span>
                      )}
                    </div>
                  )}

                  <svg className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors ml-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
