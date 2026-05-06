import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadCSV, uploadSQL, generateMetadata } from '../lib/api'
import Spinner from '../components/Spinner'

export default function Upload() {
  const [activeTab, setActiveTab] = useState('csv')
  const [schemaName, setSchemaName] = useState('')
  const [file, setFile] = useState(null)
  const [sqlText, setSqlText] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleFileDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.csv')) {
      setFile(droppedFile)
      if (!schemaName) setSchemaName(droppedFile.name.replace('.csv', ''))
    } else {
      setError('Please drop a valid CSV file')
    }
  }

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!schemaName) setSchemaName(selectedFile.name.replace('.csv', ''))
    }
  }

  const handleSubmit = async () => {
    setError(null)

    if (activeTab === 'csv' && !file) {
      setError('Please select a CSV file')
      return
    }
    if (activeTab === 'sql' && !sqlText.trim()) {
      setError('Please paste a SQL schema')
      return
    }

    setLoading(true)

    try {
      // Step 1: Parse the input
      setStatusMessage('Parsing schema...')
      let parsed

      if (activeTab === 'csv') {
        parsed = await uploadCSV(file, schemaName)
      } else {
        parsed = await uploadSQL(sqlText, schemaName)
      }

      // Step 2: Generate metadata
      setStatusMessage('Generating AI metadata... This may take a moment.')
      const result = await generateMetadata(
        parsed.schema_name || schemaName || 'Untitled Schema',
        parsed.columns
      )

      // Navigate to catalog with generated data
      navigate('/catalog', {
        state: {
          metadata: result.metadata,
          schemaName: result.schema_name || parsed.schema_name,
          rawSchema: parsed.columns,
        },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setStatusMessage('')
    }
  }

  const sqlPlaceholder = `CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  date_of_birth DATE,
  annual_income DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);`

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-800 mb-2">
            Upload Your Schema
          </h1>
          <p className="text-surface-500 text-sm sm:text-base">
            Upload a CSV file or paste a SQL CREATE TABLE statement to generate your AI-powered metadata catalog.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
          {/* Tab Selector */}
          <div className="flex border-b border-surface-200 bg-surface-50">
            <button
              id="tab-csv"
              onClick={() => { setActiveTab('csv'); setError(null) }}
              className={`flex-1 py-3.5 px-4 text-sm font-medium transition-all duration-200 relative ${
                activeTab === 'csv'
                  ? 'text-primary-600 bg-white'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Upload CSV
              </span>
              {activeTab === 'csv' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
              )}
            </button>
            <button
              id="tab-sql"
              onClick={() => { setActiveTab('sql'); setError(null) }}
              className={`flex-1 py-3.5 px-4 text-sm font-medium transition-all duration-200 relative ${
                activeTab === 'sql'
                  ? 'text-primary-600 bg-white'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Paste SQL Schema
              </span>
              {activeTab === 'sql' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
              )}
            </button>
          </div>

          <div className="p-6">
            {/* Schema Name Input */}
            <div className="mb-5">
              <label htmlFor="schema-name" className="block text-sm font-medium text-surface-700 mb-1.5">
                Schema Name
              </label>
              <input
                id="schema-name"
                type="text"
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="e.g. Customer Data, Sales Report"
                className="w-full rounded-xl border border-surface-200 px-4 py-2.5 text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
              />
            </div>

            {/* CSV Upload Area */}
            {activeTab === 'csv' && (
              <div
                id="csv-drop-zone"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-primary-400 bg-primary-50'
                    : file
                      ? 'border-emerald-300 bg-emerald-50/50'
                      : 'border-surface-300 hover:border-primary-300 hover:bg-primary-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file ? (
                  <div className="animate-fade-in">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-emerald-700">{file.name}</p>
                    <p className="text-xs text-surface-400 mt-1">
                      {(file.size / 1024).toFixed(1)} KB — Click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-surface-600">
                      Drop your CSV file here or <span className="text-primary-500">browse</span>
                    </p>
                    <p className="text-xs text-surface-400 mt-1">Supports .csv files</p>
                  </div>
                )}
              </div>
            )}

            {/* SQL Editor */}
            {activeTab === 'sql' && (
              <div>
                <textarea
                  id="sql-input"
                  value={sqlText}
                  onChange={(e) => setSqlText(e.target.value)}
                  placeholder={sqlPlaceholder}
                  rows={12}
                  className="w-full rounded-xl border border-surface-200 px-4 py-3 text-sm font-mono text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200 bg-surface-50 resize-y"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 bg-danger-100/60 border border-red-200 rounded-xl text-sm text-danger-500 animate-fade-in" id="upload-error">
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="mt-6">
                <Spinner message={statusMessage} />
              </div>
            )}

            {/* Submit Button */}
            {!loading && (
              <button
                id="btn-analyze"
                onClick={handleSubmit}
                className="w-full mt-6 py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-all duration-200 shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Analyze & Generate Metadata
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
