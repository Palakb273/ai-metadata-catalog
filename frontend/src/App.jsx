import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import Upload from './pages/Upload'
import Catalog from './pages/Catalog'
import History from './pages/History'

/* ── No auth needed — user is identified by a UUID in localStorage ── */

function Navbar() {
  const linkClasses = ({ isActive }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
        : 'text-surface-600 hover:text-primary-600 hover:bg-primary-50'
    }`

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-surface-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent hidden sm:block">
              MetaCatalog AI
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <NavLink to="/upload" className={linkClasses} id="nav-upload">
              Upload
            </NavLink>
            <NavLink to="/catalog" className={linkClasses} id="nav-catalog">
              Catalog
            </NavLink>
            <NavLink to="/history" className={linkClasses} id="nav-history">
              History
            </NavLink>
          </div>

          {/* Spacer to balance the layout */}
          <div className="w-9" />
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <Routes>
        <Route path="/upload" element={<Upload />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<Navigate to="/upload" replace />} />
      </Routes>
    </div>
  )
}
