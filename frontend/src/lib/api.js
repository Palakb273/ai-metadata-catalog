import axios from 'axios'
import { getUserId } from './userId'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach user ID to every request
api.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = getUserId()
  return config
})

// Handle error responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

/**
 * Upload a CSV file for parsing.
 */
export async function uploadCSV(file, schemaName) {
  const formData = new FormData()
  formData.append('file', file)
  if (schemaName) {
    formData.append('schema_name', schemaName)
  }
  const response = await api.post('/upload/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Upload a SQL schema for parsing.
 */
export async function uploadSQL(sqlText, schemaName) {
  const response = await api.post('/upload/sql', {
    sql_text: sqlText,
    schema_name: schemaName || null,
  })
  return response.data
}

/**
 * Generate AI metadata for parsed columns.
 */
export async function generateMetadata(schemaName, columns) {
  const response = await api.post('/generate-metadata', {
    schema_name: schemaName,
    columns: columns,
  })
  return response.data
}

/**
 * Send a chat message about the metadata.
 */
export async function sendChatMessage(message, metadata, sessionId) {
  const response = await api.post('/chat', {
    message: message,
    metadata: metadata,
    session_id: sessionId || null,
  })
  return response.data
}

/**
 * Fetch the user's analysis history.
 */
export async function fetchHistory() {
  const response = await api.get('/history')
  return response.data
}

export default api
